'use client'

import { useState, useMemo } from 'react'
import TransactionList from './TransactionList'
import { getFinancialAdvice } from '@/app/lib/actions/aiActions'

interface Transaction {
  id: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  description: string
  created_at: string
  account_id: string
  accounts?: { name: string }
  categories?: { name: string }
}

interface Account {
  id: string
  name: string
  type: string
}

type TimeRange = 'MONTH' | 'YEAR' | 'CUSTOM'

export default function PortfolioAnalytics({
  transactions,
  accounts
}: {
  transactions: Transaction[]
  accounts: Account[]
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('MONTH')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<{ text?: string; error?: string } | null>(null)

  // Filter transactions based on selected time range
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    return transactions.filter(t => {
      const date = new Date(t.created_at)
      if (timeRange === 'MONTH') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }
      if (timeRange === 'YEAR') {
        return date.getFullYear() === now.getFullYear()
      }
      if (timeRange === 'CUSTOM') {
        if (startDate && endDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return date >= start && date <= end
        }
        return true
      }
      return true
    })
  }, [transactions, timeRange, startDate, endDate])

  // Calculate metrics
  const { totalIncome, totalExpense, totalCicilan } = useMemo(() => {
    let income = 0
    let expense = 0
    let cicilan = 0

    filteredTransactions.forEach(t => {
      if (t.type === 'CREDIT') income += t.amount
      if (t.type === 'DEBIT') {
        expense += t.amount
        if (t.description?.includes('[Cicilan]')) {
          cicilan += t.amount
        }
      }
    })

    return { totalIncome: income, totalExpense: expense, totalCicilan: cicilan }
  }, [filteredTransactions])

  const netFlow = totalIncome - totalExpense
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)

  const handleAskAI = async () => {
    setIsAiLoading(true)
    setAiResponse(null)
    let rangeLabel = 'Semua Waktu'
    if (timeRange === 'MONTH') rangeLabel = 'Bulan Ini'
    if (timeRange === 'YEAR') rangeLabel = 'Tahun Ini'
    if (timeRange === 'CUSTOM' && startDate && endDate) rangeLabel = `Dari ${startDate} ke ${endDate}`
    
    try {
      const res = await getFinancialAdvice(filteredTransactions, rangeLabel)
      if (res.error) {
        setAiResponse({ error: res.error })
      } else {
        setAiResponse({ text: res.advice })
      }
    } catch (err: any) {
      setAiResponse({ error: 'Gagal menghubungi server AI.' })
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio & Analitik</h2>
          <p className="text-sm text-gray-400 mt-1">Pantau arus kas dan kesehatan finansial Anda</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex bg-[#111115] p-1 rounded-xl border border-white/10 w-fit">
            <button
              onClick={() => setTimeRange('MONTH')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${timeRange === 'MONTH' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setTimeRange('YEAR')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${timeRange === 'YEAR' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setTimeRange('CUSTOM')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${timeRange === 'CUSTOM' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Pilih Tanggal
            </button>
          </div>

          {/* Custom Date Inputs */}
          {timeRange === 'CUSTOM' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-[#111115] border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-primary w-full color-scheme-dark" 
                style={{ colorScheme: 'dark' }}
              />
              <span className="text-gray-500 text-xs font-medium">ke</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-[#111115] border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-primary w-full color-scheme-dark" 
                style={{ colorScheme: 'dark' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Total Pemasukan
          </div>
          <div className="text-2xl font-bold text-white">{formatRp(totalIncome)}</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Total Pengeluaran
          </div>
          <div className="text-2xl font-bold text-white">{formatRp(totalExpense)}</div>
          {totalCicilan > 0 && (
            <div className="text-xs text-orange-400 mt-2 font-medium bg-orange-400/10 w-fit px-2 py-1 rounded-md">
              Terdapat Cicilan: {formatRp(totalCicilan)}
            </div>
          )}
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${netFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
            Sisa / Net Flow
          </div>
          <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-white' : 'text-orange-400'}`}>
            {formatRp(netFlow)}
          </div>
        </div>
      </div>

      {/* AI Advisor Section */}
      <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Financial Advisor</h3>
                <p className="text-xs text-purple-300">Dapatkan nasehat cerdas dari asisten virtual Anda</p>
              </div>
            </div>
            <button
              onClick={handleAskAI}
              disabled={isAiLoading || filteredTransactions.length === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {isAiLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menganalisa...
                </>
              ) : 'Minta Analisa AI'}
            </button>
          </div>

          {aiResponse && (
            <div className="mt-4 p-4 bg-[#0e0e11] rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
              {aiResponse.error ? (
                <div className="text-red-400 text-sm flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  {aiResponse.error}
                </div>
              ) : (
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiResponse.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Riwayat Transaksi ({timeRange === 'MONTH' ? 'Bulan Ini' : timeRange === 'YEAR' ? 'Tahun Ini' : 'Semua'})</h3>
        {filteredTransactions.length > 0 ? (
          <TransactionList transactions={filteredTransactions} accounts={accounts} />
        ) : (
          <div className="text-center py-10 glass-card rounded-2xl border border-white/10">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 font-medium">Belum ada transaksi di periode ini.</p>
          </div>
        )}
      </div>

    </div>
  )
}
