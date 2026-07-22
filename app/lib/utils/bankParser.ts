import * as cheerio from 'cheerio'

export interface ParsedTransaction {
  amount: number
  type: 'DEBIT' | 'CREDIT'
  description: string
  bank: string
  senderEmail?: string
}

// ─────────────────────────────────────────────
// HELPER: Bersihkan string nominal Rupiah
// ─────────────────────────────────────────────
function parseRupiah(raw: string): number {
  // Hapus semua karakter non-digit (titik, koma, spasi)
  const clean = raw.replace(/[^0-9]/g, '')
  return parseInt(clean, 10) || 0
}

// ─────────────────────────────────────────────
// PARSER: BCA (notifikasi@klikbca.com)
// Format: "Rp1.000.000,00 dari/ke ..."
// ─────────────────────────────────────────────
function parseBCA(text: string): ParsedTransaction | null {
  // Debit: "didebet" / "debet" / "Transfer keluar"
  const debitMatch = text.match(/(?:didebet|debet|transfer\s*keluar|db)[:\s]*Rp\s?([0-9.,]+)/i)
  // Kredit: "dikredit" / "kredit" / "Transfer masuk"
  const creditMatch = text.match(/(?:dikredit|kredit|transfer\s*masuk|cr)[:\s]*Rp\s?([0-9.,]+)/i)

  // Fallback: "Rp X.XXX,XX" dengan konteks debet/kredit
  const amountMatch = text.match(/Rp\s?([0-9.]+(?:,[0-9]{2})?)/i)

  if (debitMatch) {
    return { amount: parseRupiah(debitMatch[1]), type: 'DEBIT', description: extractBCADescription(text), bank: 'BCA' }
  }
  if (creditMatch) {
    return { amount: parseRupiah(creditMatch[1]), type: 'CREDIT', description: extractBCADescription(text), bank: 'BCA' }
  }
  // Fallback: coba deteksi dari kata "debet/kredit" dalam teks
  if (amountMatch) {
    const isDebit = /debet|keluar|db\b/i.test(text)
    return { amount: parseRupiah(amountMatch[1]), type: isDebit ? 'DEBIT' : 'CREDIT', description: extractBCADescription(text), bank: 'BCA' }
  }
  return null
}

function extractBCADescription(text: string): string {
  const match = text.match(/(?:kepada|dari|berita|keterangan|ket)[:\s]+([^\n\r|]+)/i)
  return match ? match[1].trim().substring(0, 100) : 'Transaksi BCA'
}

// ─────────────────────────────────────────────
// PARSER: Mandiri (mandirikartu@bankmandiri.co.id / notifikasi@bankmandiri.co.id)
// Format: "sebesar Rp 1.000.000,00"
// ─────────────────────────────────────────────
function parseMandiri(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:sebesar|senilai|Rp)\s*(?:Rp)?\s*([0-9.,]+)/i)
  if (!amountMatch) return null

  const amount = parseRupiah(amountMatch[1])
  const isDebit = /(?:pembelian|pembayaran|penarikan|debet|transfer\s*keluar|db\b)/i.test(text)
  const isCredit = /(?:penerimaan|setoran|transfer\s*masuk|kredit|cr\b)/i.test(text)

  const descMatch = text.match(/(?:merchant|kepada|dari|keterangan)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi Mandiri'

  return {
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    description,
    bank: 'Mandiri'
  }
}

// ─────────────────────────────────────────────
// PARSER: BRI (notifikasi@bri.co.id)
// Format: "Rp1.000.000" dengan kata "Debit"/"Kredit"
// ─────────────────────────────────────────────
function parseBRI(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)[.\s]*([0-9.,]+)/i)
  if (!amountMatch) return null

  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:kredit|masuk|cr\b)/i.test(text)

  const descMatch = text.match(/(?:keterangan|berita|ket|deskripsi)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi BRI'

  return {
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    description,
    bank: 'BRI'
  }
}

// ─────────────────────────────────────────────
// PARSER: BNI (notifikasi@bni.co.id)
// ─────────────────────────────────────────────
function parseBNI(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null

  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:kredit|credit|masuk|cr)/i.test(text)

  const descMatch = text.match(/(?:keterangan|berita|merchant)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi BNI'

  return {
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    description,
    bank: 'BNI'
  }
}

// ─────────────────────────────────────────────
// PARSER UTAMA: Deteksi bank dari pengirim/konten
// ─────────────────────────────────────────────
export class GenericBankParser {
  parse(htmlBody: string, senderEmail?: string): ParsedTransaction {
    const $ = cheerio.load(htmlBody)
    const text = $.root().text().replace(/\s+/g, ' ').trim()

    const sender = (senderEmail || '').toLowerCase()

    // Deteksi berdasarkan email pengirim (paling akurat)
    if (sender.includes('klikbca') || sender.includes('bca.co.id')) {
      const result = parseBCA(text)
      if (result) return result
    }

    if (sender.includes('bankmandiri') || sender.includes('mandiri')) {
      const result = parseMandiri(text)
      if (result) return result
    }

    if (sender.includes('bri.co.id') || sender.includes('@bri')) {
      const result = parseBRI(text)
      if (result) return result
    }

    if (sender.includes('bni.co.id') || sender.includes('@bni')) {
      const result = parseBNI(text)
      if (result) return result
    }

    // Fallback: coba semua parser berurutan
    return (
      parseBCA(text) ||
      parseMandiri(text) ||
      parseBRI(text) ||
      parseBNI(text) ||
      // Last resort: cari pola "Rp X" apapun
      (() => {
        const m = text.match(/Rp\s?([0-9.,]+)/i)
        if (m) {
          const isDebit = /(?:debet|keluar|pembayaran|pembelian)/i.test(text)
          return {
            amount: parseRupiah(m[1]),
            type: isDebit ? 'DEBIT' : 'CREDIT' as 'DEBIT' | 'CREDIT',
            description: 'Transaksi Bank',
            bank: 'Unknown'
          }
        }
        throw new Error('Format email tidak dikenali sebagai notifikasi bank')
      })()
    )
  }
}


