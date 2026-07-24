'use client'

import { useState, useActionState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateTransaction, deleteTransaction } from '@/app/lib/actions/financeActions'

interface Account {
  id: string
  name: string
  type: string
}

interface Transaction {
  id: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  description: string
  account_id: string
  created_at: string
}

export default function EditTransactionModal({
  transaction,
  accounts,
  isOpen,
  onClose
}: {
  transaction: Transaction
  accounts: Account[]
  isOpen: boolean
  onClose: (deletedId?: string) => void
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateTransaction, null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State untuk format Rupiah
  const [rawAmount, setRawAmount] = useState(transaction.amount.toString())
  const [displayAmount, setDisplayAmount] = useState(
    new Intl.NumberFormat('id-ID').format(transaction.amount)
  )

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state, onClose, router])

  // Format angka ke rupiah
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setRawAmount(value)
    
    if (value) {
      const formatted = new Intl.NumberFormat('id-ID').format(Number(value))
      setDisplayAmount(formatted)
    } else {
      setDisplayAmount('')
    }
  }

  const handleDelete = async () => {
    if (confirm('Yakin ingin menghapus transaksi ini? Saldo akun akan dikembalikan.')) {
      setIsDeleting(true)
      const res = await deleteTransaction(transaction.id)
      setIsDeleting(false)
      if (res?.success) {
        onClose(transaction.id)
        router.refresh()
      } else if (res?.error) {
        alert(`Gagal menghapus: ${res.error}`)
      }
    }
  }

  // Format the default datetime-local value (YYYY-MM-DDTHH:mm)
  const defaultDate = transaction.created_at ? new Date(transaction.created_at).toISOString().slice(0, 16) : ''

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen) return null

  return mounted ? createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-[#0e0e11] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Edit Transaksi</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting || isPending}
              className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
              title="Hapus Transaksi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={transaction.id} />
          
          {/* Tipe */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tipe Transaksi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'CREDIT', label: 'Masuk', emoji: '📥', color: 'peer-checked:bg-primary/20 peer-checked:border-primary/50 peer-checked:text-primary' },
                { value: 'DEBIT', label: 'Keluar', emoji: '📤', color: 'peer-checked:bg-red-500/20 peer-checked:border-red-500/50 peer-checked:text-red-400' },
                { value: 'CICILAN', label: 'Cicilan', emoji: '📋', color: 'peer-checked:bg-orange-500/20 peer-checked:border-orange-500/50 peer-checked:text-orange-400' },
              ].map((opt, i) => {
                // Determine if this should be checked. If description contains [Cicilan], it's a CICILAN.
                const isCicilan = transaction.description?.includes('[Cicilan]');
                const isChecked = opt.value === 'CICILAN' ? isCicilan : (!isCicilan && transaction.type === opt.value);
                return (
                  <label key={i} className="cursor-pointer">
                    <input type="radio" name="type" value={opt.value} defaultChecked={isChecked} className="peer sr-only" required />
                    <div className={`text-center py-2.5 px-1 rounded-xl border border-white/10 text-gray-400 text-xs font-medium ${opt.color} transition-all`}>
                      <div className="text-base mb-0.5">{opt.emoji}</div>
                      {opt.label}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Tanggal / Jam */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Waktu Transaksi</label>
            <input
              type="datetime-local"
              name="created_at"
              defaultValue={defaultDate}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none text-sm color-scheme-dark"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Jumlah */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Jumlah (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              required
              placeholder="0"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 text-lg font-semibold outline-none placeholder-white/20"
            />
            <input type="hidden" name="amount" value={rawAmount} />
          </div>

          {/* Akun */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Akun</label>
            <select
              name="account_id"
              required
              defaultValue={transaction.account_id}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none appearance-none text-sm"
            >
              <option value="" disabled className="bg-[#0e0e11]">Pilih Akun...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-[#0e0e11]">
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Keterangan</label>
            <input
              type="text"
              name="description"
              defaultValue={transaction.description?.replace('[Cicilan]', '').trim()}
              placeholder="contoh: Makan siang, Gaji..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !rawAmount || isDeleting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-98 text-sm mt-4"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  ) : null
}
