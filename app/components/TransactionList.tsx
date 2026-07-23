'use client'

import { useState } from 'react'
import EditTransactionModal from './EditTransactionModal'

export default function TransactionList({ transactions, accounts }: { transactions: any[], accounts: any[] }) {
  const [editingTx, setEditingTx] = useState<any>(null)

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
      <div className="glass-panel overflow-hidden divide-y divide-white/5">
        {transactions.map((tx) => (
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
