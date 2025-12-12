'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPasswordRequest(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string

    if (!email) {
      return { error: 'Email is required' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Password reset error:', err)
    return { error: 'Unable to connect to authentication service. Please check your internet connection and try again.' }
  }
}

export async function updatePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password is required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}