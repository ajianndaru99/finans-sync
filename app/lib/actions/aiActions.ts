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
Peran: Kamu adalah Akuntan Senior dan Perencana Keuangan (Financial Planner) profesional.
Berikut adalah data arus kas klien untuk periode: ${timeRangeLabel}

Total Pemasukan: Rp ${totalIncome}
Total Pengeluaran: Rp ${totalExpense}
Sisa (Net Flow): Rp ${totalIncome - totalExpense}
Total Beban Cicilan: Rp ${totalCicilan}

Rincian Transaksi Terakhir (sebagai referensi pola pengeluaran):
${summaryList}

Tugasmu:
Fokuslah memberikan wawasan (insight) tingkat lanjut berdasarkan data periode di atas. Jangan sekadar mengulang angka, tapi berikan makna dari angka tersebut.
Format balasanmu HANYA menggunakan Markdown berikut:

**📊 Diagnosa Keuangan:**
(Satu paragraf evaluasi profesional mengenai kesehatan rasio pemasukan, pengeluaran, dan beban cicilan klien pada periode ini).

**💡 Saran Optimalisasi:**
(Berikan 2-3 poin evaluasi pengeluaran. Area mana yang boros berdasarkan rincian transaksi? Apa yang harus dipertahankan?).

**🚀 Planning Kedepan (Action Plan):**
(Berikan 2-3 langkah nyata perencanaan keuangan untuk bulan/periode berikutnya. Misalnya strategi alokasi dana, pelunasan utang, atau instrumen investasi).

Gaya Bahasa: Profesional, objektif, solutif, layaknya akuntan senior. Gunakan bahasa Indonesia yang baku namun mudah dicerna (gunakan bullet points).
`

    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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

    let data = await response.json()

    // If the model is not found or not supported, try to automatically find a working model
    if (!response.ok && data.error?.message?.includes('not found')) {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      const modelsData = await modelsRes.json()
      
      if (modelsData.models) {
        // Find the first model that supports generateContent (preferring flash or pro)
        let validModel = modelsData.models.find((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') && 
          m.name.includes('gemini-1.5-flash')
        )

        if (!validModel) {
          validModel = modelsData.models.find((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent') && 
            m.name.includes('gemini-1.5-pro')
          )
        }

        if (!validModel) {
          validModel = modelsData.models.find((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent') && 
            m.name.includes('gemini') && !m.name.includes('vision') && !m.name.includes('embedding')
          )
        }

        if (validModel) {
          // Retry with the found valid model (name already includes "models/")
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${validModel.name}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          })
          data = await response.json()
        }
      }
    }

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
