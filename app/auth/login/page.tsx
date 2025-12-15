'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Better error messages
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        if (error.message.includes('Invalid login credentials') || error.status === 401) {
          setError('Credenciales inválidas. Verifica tu email y contraseña. Si el usuario existe, puede que necesite ser confirmado en Supabase Dashboard.')
        } else if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
          setError('Email no confirmado. Ve a Supabase Dashboard → Authentication → Users y confirma el usuario.')
        } else {
          setError(error.message || 'Error al iniciar sesión. Revisa la consola para más detalles.')
        }
        return
      }

      if (data.user) {
        // Check if user is confirmed
        if (!data.user.email_confirmed_at && data.user.confirmed_at) {
          // User might need email confirmation
          console.log('User not confirmed:', data.user)
        }

        // Get user role from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          // If profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || null,
              role: 'client',
            })

          if (insertError) {
            console.error('Error creating profile:', insertError)
          }

          // Try to get profile again
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          // Redirect based on role
          if (newProfile?.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        } else {
          // Redirect based on role
          if (profile?.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        }
        router.refresh()
      }
    } catch (err: any) {
      console.error('Login exception:', err)
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Quantor Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 quantor-logo rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">Quantor</h1>
              <p className="text-sm text-muted-foreground">Analytics Platform</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-muted-foreground">Accede a tu panel de analytics</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
                {error.includes('Credenciales inválidas') && (
                  <div className="text-xs text-destructive/80 mt-2 pl-6">
                    <p>• Verifica que el email y contraseña sean correctos</p>
                    <p>• Si el usuario existe, puede necesitar resetear la contraseña en Supabase Dashboard</p>
                    <p>• Ve a: Authentication → Users → Reset Password</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6 space-y-2">
          <div>
            <a href="/auth/reset-password" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña? Restablecer contraseña
            </a>
          </div>
          <div className="text-muted-foreground">
            ¿Necesitas una cuenta?{' '}
            <span className="text-foreground">Contacta al administrador</span>
          </div>
        </p>
      </div>
    </div>
  )
}

