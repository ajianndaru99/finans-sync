import { createClient } from '@/utils/supabase/server'

export async function getAccounts() {
  const supabase = await createClient()
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching accounts:', error)
    throw new Error('Failed to fetch accounts')
  }

  return accounts
}

export async function getTransactions(limit = 10) {
  const supabase = await createClient()
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      accounts (name),
      categories (name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }

  return transactions
}

export async function getInvestments() {
  const supabase = await createClient()
  const { data: investments, error } = await supabase
    .from('investment_assets')
    .select('*')

  if (error) {
    console.error('Error fetching investments:', error)
    throw new Error('Failed to fetch investments')
  }

  return investments
}

export async function getDebts() {
  const supabase = await createClient()
  const { data: debts, error } = await supabase
    .from('debts_ledger')
    .select('*')
    .in('status', ['ACTIVE', 'PARTIAL'])

  if (error) {
    console.error('Error fetching debts:', error)
    throw new Error('Failed to fetch debts')
  }

  return debts
}
