'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAccount(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const initialBalance = parseFloat(formData.get('initialBalance') as string)

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name,
    type,
    current_balance: initialBalance
  })

  if (error) {
    console.error('Error creating account:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createTransaction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const account_id = formData.get('account_id') as string
  const category_id = formData.get('category_id') as string
  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const created_at = formData.get('created_at') as string

  let finalType = type
  let finalDescription = description

  if (type === 'CICILAN') {
    finalType = 'DEBIT'
    if (!description.includes('[Cicilan]')) {
      finalDescription = `[Cicilan] ${description}`.trim()
    }
  }

  const insertData: any = {
    user_id: user.id,
    account_id,
    type: finalType,
    amount,
    description: finalDescription
  }

  if (category_id && category_id !== '') {
    insertData.category_id = category_id
  }

  if (created_at && created_at !== '') {
    insertData.created_at = new Date(created_at).toISOString()
  }

  const { error } = await supabase.from('transactions').insert(insertData)

  if (error) {
    console.error('Error creating transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateTransaction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  const account_id = formData.get('account_id') as string
  const type = formData.get('type') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const created_at = formData.get('created_at') as string

  let finalType = type
  let finalDescription = description

  if (type === 'CICILAN') {
    finalType = 'DEBIT'
    if (!description.includes('[Cicilan]')) {
      finalDescription = `[Cicilan] ${description}`.trim()
    }
  } else {
    // If it was changed from Cicilan to something else, remove the tag if present
    finalDescription = description.replace('[Cicilan]', '').trim()
  }

  const updateData: any = {
    account_id,
    type: finalType,
    amount,
    description: finalDescription
  }

  if (created_at && created_at !== '') {
    updateData.created_at = new Date(created_at).toISOString()
  }

  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Hapus transaksi yang terkait terlebih dahulu
  await supabase
    .from('transactions')
    .delete()
    .eq('account_id', id)
    .eq('user_id', user.id)

  // Hapus integrasi akun jika ada
  await supabase
    .from('account_integrations')
    .delete()
    .eq('account_id', id)

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting account:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function updateAccount(id: string, name: string, currentBalance: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('accounts')
    .update({ name, current_balance: currentBalance })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating account:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
