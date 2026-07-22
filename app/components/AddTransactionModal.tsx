'use client'

import { useState, useActionState, useEffect } from 'react'
import { createTransaction } from '@/app/lib/actions/financeActions'

interface Account {
  id: string
  name: string
  type: string
}

export default function AddTransactionModal({ accounts }: { accounts: Account[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createTransaction, null)

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state])

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white font-medium transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
      >
        + Add Transaction
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-white/10 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Record Transaction</h3>
            
            {state?.error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Transaction Type</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="type" value="DEBIT" className="peer sr-only" required />
                    <div className="text-center py-2 rounded-xl border border-white/10 text-gray-400 peer-checked:bg-red-500/20 peer-checked:border-red-500/50 peer-checked:text-red-400 transition-all">
                      Expense (Out)
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="type" value="CREDIT" className="peer sr-only" required />
                    <div className="text-center py-2 rounded-xl border border-white/10 text-gray-400 peer-checked:bg-primary/20 peer-checked:border-primary/50 peer-checked:text-primary transition-all">
                      Income (In)
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (Rp)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1"
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Account</label>
                <select 
                  name="account_id" 
                  required
                  defaultValue=""
                  className="w-full px-4 py-3 bg-[#111115] border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none appearance-none"
                >
                  <option value="" disabled>Select Account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (Optional)</label>
                <input 
                  type="text" 
                  name="description" 
                  placeholder="e.g. Lunch, Salary"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 mt-4"
              >
                {isPending ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
