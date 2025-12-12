import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, go to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Otherwise, go to upload page (free feature)
  redirect('/upload')
}