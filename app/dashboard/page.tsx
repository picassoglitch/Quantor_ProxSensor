'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Dashboard from '../page'
import { User } from 'lucide-react'

export default function ClientDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      console.error('Error loading profile:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      // Try to create profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || null,
            role: 'client',
          })
        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          // Retry getting profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, created_at')
            .eq('id', authUser.id)
            .single()
          if (newProfile?.role === 'admin') {
            router.push('/admin')
            return
          }
          setUser(newProfile)
          setLoading(false)
          return
        }
      }
      router.push('/auth/login')
      return
    }

    console.log('User profile:', { email: profile?.email, role: profile?.role })

    if (profile?.role === 'admin') {
      console.log('User is admin, redirecting to /admin')
      router.push('/admin')
      router.refresh()
      return
    }

    setUser(profile)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Render the main dashboard but filtered by client's stores
  return <Dashboard clientId={user?.id} />
}

