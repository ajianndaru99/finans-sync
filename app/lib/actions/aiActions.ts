'use server'

export async function getFinancialAdvice(transactions: any[], timeRangeLabel: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { error: 'API Key Gemini belum disetel. Silakan tambahkan GEMINI_API_KEY di Vercel.' }
    }

    // Summarize the data to save tokens and keep it focused
    let totalIncome = 0
    let totalExpense = 0
    let totalCicilan = 0

    const summaryList = transactions.map(t => {
      const isCicilan = t.description?.includes('[Cicilan]')
      if (t.type === 'CREDIT') totalIncome += t.amount
      if (t.type === 'DEBIT') {
        totalExpense += t.amount
        if (isCicilan) totalCicilan += t.amount
      }
      return `- ${t.created_at.substring(0, 10)}: ${t.type === 'CREDIT' ? 'Masuk' : 'Keluar'} Rp ${t.amount} (${t.description || 'Tanpa keterangan'})`
    }).join('\n')

    const prompt = `
Kamu adalah penasihat keuangan pribadi yang cerdas, santai, dan blak-blakan.
Berikut adalah rangkuman keuangan pengguna untuk periode: ${timeRangeLabel}

Total Pemasukan: Rp ${totalIncome}
Total Pengeluaran: Rp ${totalExpense}
Sisa (Net Flow): Rp ${totalIncome - totalExpense}
Total Beban Cicilan: Rp ${totalCicilan}

Rincian Transaksi Terakhir:
${summaryList}

Tugasmu:
1. Berikan analisa singkat (maksimal 3 paragraf pendek) tentang kondisi keuangan ini.
2. Jika pengeluaran lebih besar dari pemasukan, berikan peringatan keras tapi supportif.
3. Jika cicilan terlalu besar (misal lebih dari 30% pemasukan), ingatkan tentang bahaya hutang.
4. Jika sehat, berikan pujian dan saran untuk menabung/investasi.
Gunakan bahasa Indonesia santai yang mudah dimengerti (bisa pakai emoji). Jangan bertele-tele.
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal menghubungi Gemini API')
    }

    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa memberikan saran saat ini.'

    return { success: true, advice }
  } catch (error: any) {
    console.error('AI Error:', error)
    return { error: error.message || 'Terjadi kesalahan saat memproses AI.' }
  }
}
