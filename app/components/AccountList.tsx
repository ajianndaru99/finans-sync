'use client'

import { useState, useTransition } from 'react'
import { deleteAccount, updateAccount } from '@/app/lib/actions/financeActions'

interface Account {
  id: string
  name: string
  type: string
  current_balance: number
}

interface AccountListProps {
  accounts: Account[]
}

export default function AccountList({ accounts }: AccountListProps) {
  const [isPending, startTransition] = useTransition()
  const [editingAcc, setEditingAcc] = useState<Account | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun "${name}" beserta semua riwayat transaksinya?`)) {
      startTransition(async () => {
        const res = await deleteAccount(id)
        if (res.error) {
          alert(`Gagal menghapus akun: ${res.error}`)
        }
      })
    }
  }

  const handleOpenEdit = (acc: Account) => {
    setEditingAcc(acc)
    setEditName(acc.name)
    setEditBalance(acc.current_balance.toString())
    setErrorMsg('')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAcc) return

    startTransition(async () => {
      const res = await updateAccount(editingAcc.id, editName, parseFloat(editBalance) || 0)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setEditingAcc(null)
      }
    })
  }

  if (accounts.length === 0) {
    return <div className="text-gray-500 text-sm py-3 px-1">No accounts found.</div>
  }

  return (
    <>
      <div className="space-y-2">
        {accounts.map((acc) => (
          <div key={acc.id} className="glass-panel-dark p-4 flex justify-between items-center group relative">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                acc.type === 'BANK' ? 'bg-accent/20 text-accent' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {acc.type === 'BANK' ? '🏦' : '📱'}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-100">{acc.name}</p>
                <p className="text-xs text-gray-500">{acc.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className={`font-bold text-sm tabular-nums ${Number(acc.current_balance) >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                {formatIDR(Number(acc.current_balance))}
              </p>

              {/* Action buttons (Edit & Delete) */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(acc)}
                  disabled={isPending}
                  title="Edit Akun / Saldo"
                  className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors text-xs"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(acc.id, acc.name)}
                  disabled={isPending}
                  title="Hapus Akun"
                  className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit Account */}
      {editingAcc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0e0e11] p-6 rounded-2xl border border-white/10 relative shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingAcc(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Edit Akun ({editingAcc.name})</h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Nama Akun</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-gray-100 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Saldo Saat Ini (Rp)</label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-gray-100 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAcc(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
