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
  // Abaikan sen di belakang koma (misal: ,00)
  const withoutDecimal = raw.split(',')[0]
  // Hapus semua karakter non-digit (titik, spasi, dsb)
  const clean = withoutDecimal.replace(/[^0-9]/g, '')
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
  const amountMatch = text.match(/\bRp\s?([0-9.]+(?:,[0-9]{2})?)/i)

  if (debitMatch) {
    return { amount: parseRupiah(debitMatch[1]), type: 'DEBIT', description: extractBCADescription(text), bank: 'BCA' }
  }
  if (creditMatch) {
    return { amount: parseRupiah(creditMatch[1]), type: 'CREDIT', description: extractBCADescription(text), bank: 'BCA' }
  }
  // Fallback: coba deteksi dari kata "debet/kredit" dalam teks
  if (amountMatch) {
    const isDebit = /debet|keluar|\bdb\b/i.test(text)
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
// PARSER: Bank Jago (no-reply@jago.com)
// ─────────────────────────────────────────────
function parseJago(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null

  const amount = parseRupiah(amountMatch[1])
  
  // Bank Jago usually uses "menerima uang", "uang masuk", "top up" for credit
  const isCredit = /(?:menerima|masuk|top up|terima|kredit|cr\b)/i.test(text)
  
  const descMatch = text.match(/(?:keterangan|catatan|berita|untuk|ke|dari|merchant)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi Bank Jago'

  return {
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    description,
    bank: 'Jago'
  }
}

// ─────────────────────────────────────────────
// PARSER: Bank BPD DIY
// ─────────────────────────────────────────────
function parseBPDDIY(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null

  const amount = parseRupiah(amountMatch[1])
  
  // Deteksi kredit: uang masuk, kredit, penyetoran
  const isCredit = /(?:masuk|kredit|setor|terima|cr\b)/i.test(text)
  
  const descMatch = text.match(/(?:keterangan|berita|uraian)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi Bank BPD DIY'

  return {
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    description,
    bank: 'BPD DIY'
  }
}

// ─────────────────────────────────────────────
// PARSER: Bank BTN
// ─────────────────────────────────────────────
function parseBTN(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:kredit|masuk|setor|terima)/i.test(text)
  const descMatch = text.match(/(?:keterangan|berita)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi BTN'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'BTN' }
}

// ─────────────────────────────────────────────
// PARSER: FLIP
// ─────────────────────────────────────────────
function parseFlip(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:uang masuk|berhasil menerima|refund)/i.test(text)
  const descMatch = text.match(/(?:dari|ke|berita|keterangan)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi Flip'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'Flip' }
}

// ─────────────────────────────────────────────
// PARSER: ShopeePay
// ─────────────────────────────────────────────
function parseShopeePay(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:top up|berhasil diisi|menerima|cashback|refund)/i.test(text)
  const descMatch = text.match(/(?:merchant|keterangan|ke|dari)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi ShopeePay'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'ShopeePay' }
}

// ─────────────────────────────────────────────
// PARSER: DANA
// ─────────────────────────────────────────────
function parseDana(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:top up|isi saldo|menerima|uang masuk|cashback)/i.test(text)
  const descMatch = text.match(/(?:pembayaran ke|keterangan|pesan)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi DANA'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'DANA' }
}

// ─────────────────────────────────────────────
// PARSER: GoPay
// ─────────────────────────────────────────────
function parseGoPay(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:top up|isi saldo|cashback|terima|menerima)/i.test(text)
  const descMatch = text.match(/(?:merchant|keterangan|untuk)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi GoPay'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'GoPay' }
}

// ─────────────────────────────────────────────
// PARSER: OVO
// ─────────────────────────────────────────────
function parseOvo(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:top up|isi saldo|cashback|terima uang)/i.test(text)
  const descMatch = text.match(/(?:merchant|keterangan|pesan)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi OVO'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'OVO' }
}

// ─────────────────────────────────────────────
// PARSER: SeaBank
// ─────────────────────────────────────────────
function parseSeaBank(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:uang masuk|berhasil menerima|terima|kredit)/i.test(text)
  const descMatch = text.match(/(?:dari|ke|berita|keterangan)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi SeaBank'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'SeaBank' }
}

// ─────────────────────────────────────────────
// PARSER: AstraPay
// ─────────────────────────────────────────────
function parseAstraPay(text: string): ParsedTransaction | null {
  const amountMatch = text.match(/(?:Rp|IDR)\s*([0-9.,]+)/i)
  if (!amountMatch) return null
  const amount = parseRupiah(amountMatch[1])
  const isCredit = /(?:top up|isi saldo|cashback|menerima)/i.test(text)
  const descMatch = text.match(/(?:merchant|keterangan|pesan)[:\s]+([^\n\r|<]+)/i)
  const description = descMatch ? descMatch[1].trim().substring(0, 100) : 'Transaksi AstraPay'
  return { amount, type: isCredit ? 'CREDIT' : 'DEBIT', description, bank: 'AstraPay' }
}

// ─────────────────────────────────────────────
// PARSER UTAMA: Deteksi bank dari pengirim/konten
// ─────────────────────────────────────────────
export class GenericBankParser {
  parse(htmlBody: string, senderEmail?: string): ParsedTransaction {
    const $ = cheerio.load(htmlBody)
    const text = $.root().text().replace(/\s+/g, ' ').trim()

    const sender = (senderEmail || '').toLowerCase()

    // Deteksi berdasarkan email pengirim (Hanya menerima pengirim resmi)
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

    if (sender.includes('btn.co.id') || sender.includes('@btn')) {
      const result = parseBTN(text)
      if (result) return result
    }

    if (sender.includes('jago.com') || sender.includes('@jago')) {
      const result = parseJago(text)
      if (result) return result
    }

    if (sender.includes('bpddiy') || sender.includes('bpd diy')) {
      const result = parseBPDDIY(text)
      if (result) return result
    }

    if (sender.includes('flip.id') || sender.includes('@flip')) {
      const result = parseFlip(text)
      if (result) return result
    }

    if (sender.includes('shopee.co.id') || sender.includes('shopeepay')) {
      const result = parseShopeePay(text)
      if (result) return result
    }

    if (sender.includes('dana.id') || sender.includes('@dana')) {
      const result = parseDana(text)
      if (result) return result
    }

    if (sender.includes('gojek.com') || sender.includes('@gojek')) {
      const result = parseGoPay(text)
      if (result) return result
    }

    if (sender.includes('ovo.id') || sender.includes('@ovo')) {
      const result = parseOvo(text)
      if (result) return result
    }

    if (sender.includes('seabank.co.id') || sender.includes('@seabank')) {
      const result = parseSeaBank(text)
      if (result) return result
    }

    if (sender.includes('astrapay.com') || sender.includes('@astrapay')) {
      const result = parseAstraPay(text)
      if (result) return result
    }

    throw new Error('Format email atau pengirim tidak dikenali sebagai notifikasi bank/e-wallet resmi')
  }
}


