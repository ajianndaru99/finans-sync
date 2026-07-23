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

  const insertData: any = {
    user_id: user.id,
    account_id,
    type,
    amount,
    description
  }

  if (category_id && category_id !== '') {
    insertData.category_id = category_id
  }

  const { error } = await supabase.from('transactions').insert(insertData)

  if (error) {
    console.error('Error creating transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
