'use client'

import { useState, useActionState, useEffect } from 'react'
import { createTransaction } from '@/app/lib/actions/financeActions'

interface Account {
  id: string
  name: string
  type: string
}

export default function NewEntryButton({ accounts }: { accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createTransaction, null)
  
  // State untuk format Rupiah
  const [rawAmount, setRawAmount] = useState('')
  const [displayAmount, setDisplayAmount] = useState('')

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
      setRawAmount('')
      setDisplayAmount('')
    }
  }, [state])

  // Format angka ke rupiah (dengan pemisah ribuan)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Hanya ambil angka
    setRawAmount(value)
    
    if (value) {
      const formatted = new Intl.NumberFormat('id-ID').format(Number(value))
      setDisplayAmount(formatted)
    } else {
      setDisplayAmount('')
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Transaksi</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          {/* Modal Sheet (slide up dari bawah di HP) - Tambah max-h dan overflow agar bisa discroll jika kepanjangan */}
          <div className="w-full md:max-w-md bg-[#0e0e11] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 pb-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden"></div>

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Tambah Transaksi</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {state?.error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              {/* Tipe */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tipe Transaksi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'CREDIT', label: 'Masuk', emoji: '📥', color: 'peer-checked:bg-primary/20 peer-checked:border-primary/50 peer-checked:text-primary' },
                    { value: 'DEBIT', label: 'Keluar', emoji: '📤', color: 'peer-checked:bg-red-500/20 peer-checked:border-red-500/50 peer-checked:text-red-400' },
                    { value: 'DEBIT', label: 'Cicilan', emoji: '📋', color: 'peer-checked:bg-orange-500/20 peer-checked:border-orange-500/50 peer-checked:text-orange-400' },
                  ].map((opt, i) => (
                    <label key={i} className="cursor-pointer">
                      <input type="radio" name="type" value={opt.value} className="peer sr-only" required />
                      <div className={`text-center py-2.5 px-1 rounded-xl border border-white/10 text-gray-400 text-xs font-medium ${opt.color} transition-all`}>
                        <div className="text-base mb-0.5">{opt.emoji}</div>
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tanggal / Jam */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Waktu Transaksi (Opsional)</label>
                <input
                  type="datetime-local"
                  name="created_at"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none text-sm color-scheme-dark"
                  style={{ colorScheme: 'dark' }}
                />
                <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Kosongkan jika transaksi terjadi sekarang.</p>
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
                  defaultValue=""
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none appearance-none text-sm"
                >
                  <option value="" disabled className="bg-[#0e0e11]">Pilih Akun...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-[#0e0e11]">
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
                {accounts.length === 1 && (
                  <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Akun lain akan otomatis bertambah saat email bank masuk.</p>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Keterangan (Opsional)</label>
                <input
                  type="text"
                  name="description"
                  placeholder="contoh: Makan siang, Gaji..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !rawAmount}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-98 text-sm mt-4"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
