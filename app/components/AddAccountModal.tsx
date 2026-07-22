'use client'

import { useState, useActionState, useEffect } from 'react'
import { createAccount } from '@/app/lib/actions/financeActions'

export default function AddAccountModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  // useActionState (React 19) to handle form state
  const [state, formAction, isPending] = useActionState(createAccount, null)

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state])

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors text-sm"
      >
        + Add Account
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
            <h3 className="text-xl font-bold text-white mb-6">Add New Account</h3>
            
            {state?.error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Account Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g. BCA, OVO, Cash"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Account Type</label>
                <select 
                  name="type" 
                  required
                  className="w-full px-4 py-3 bg-[#111115] border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none appearance-none"
                >
                  <option value="BANK">Bank</option>
                  <option value="EWALLET">E-Wallet</option>
                  <option value="CASH">Cash</option>
                  <option value="INVESTMENT">Investment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Initial Balance (Rp)</label>
                <input 
                  type="number" 
                  name="initialBalance" 
                  required 
                  defaultValue="0"
                  min="0"
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:bg-black/40 focus:ring-2 focus:ring-primary focus:border-primary text-gray-100 outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 mt-4"
              >
                {isPending ? 'Saving...' : 'Save Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
