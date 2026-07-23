'use client'

import { useState } from 'react'
import EditTransactionModal from './EditTransactionModal'

export default function TransactionList({ transactions, accounts, showTypeFilter = false }: { transactions: any[], accounts: any[], showTypeFilter?: boolean }) {
  const [editingTx, setEditingTx] = useState<any>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'CICILAN'>('ALL')

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'ALL') return true
    if (filterType === 'CREDIT') return tx.type === 'CREDIT'
    if (filterType === 'DEBIT') return tx.type === 'DEBIT' && !tx.description?.includes('[Cicilan]')
    if (filterType === 'CICILAN') return tx.type === 'DEBIT' && tx.description?.includes('[Cicilan]')
    return true
  })

  if (transactions.length === 0) {
    return (
      <div className="glass-panel p-10 text-center text-gray-500">
        <div className="text-4xl mb-3">💸</div>
        <p className="font-medium">Belum ada transaksi</p>
        <p className="text-sm mt-1">Transaksi otomatis akan muncul di sini saat email bank masuk</p>
      </div>
    )
  }

  return (
    <>
      {showTypeFilter && (
        <div className="flex bg-[#111115] p-1 rounded-xl border border-white/10 w-full mb-3">
          <button
            onClick={() => setFilterType('ALL')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'ALL' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('CREDIT')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'CREDIT' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setFilterType('DEBIT')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'DEBIT' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Keluar
          </button>
          <button
            onClick={() => setFilterType('CICILAN')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === 'CICILAN' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Cicilan
          </button>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="glass-panel p-6 text-center text-gray-500 text-sm">
          Tidak ada transaksi untuk filter ini.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden divide-y divide-white/5">
          {filteredTransactions.map((tx) => (
          <div 
            key={tx.id} 
            onClick={() => setEditingTx(tx)}
            className="flex items-center gap-3 p-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
          >
            {/* Ikon */}
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-base ${
              tx.type === 'CREDIT'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-red-500/15 text-red-400 border border-red-500/20'
            }`}>
              {tx.type === 'CREDIT' ? '↓' : '↑'}
            </div>

            {/* Info tengah */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-100 line-clamp-1">
                {tx.description || 'System Entry'}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-500">{formatDate(tx.created_at)}</span>
                {tx.accounts?.name && (
                  <>
                    <span className="text-gray-700 text-xs">•</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 border border-white/8 text-gray-400">
                      {tx.accounts.name}
                    </span>
                  </>
                )}
                {tx.categories?.name && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary/80">
                    {tx.categories.name}
                  </span>
                )}
              </div>
            </div>

            {/* Jumlah */}
            <div className={`text-sm font-bold tabular-nums shrink-0 ${
              tx.type === 'CREDIT' ? 'text-primary' : 'text-gray-200'
            }`}>
              {tx.type === 'CREDIT' ? '+' : '-'}
              {formatIDR(Number(tx.amount))}
            </div>
          </div>
        ))}
      </div>
      )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          accounts={accounts}
          isOpen={!!editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
    </>
  )
}
