'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Lock, AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [requestEmail, setRequestEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we have a token in the URL (from email link)
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    // Supabase password reset emails redirect with hash fragments
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const typeFromHash = hashParams.get('type')
        
        // If we have tokens in hash, set session immediately
        if (accessToken && refreshToken) {
          console.log('Found tokens in hash, setting session...')
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(({ data, error }) => {
            if (error) {
              console.error('Error setting session:', error)
              setTokenValid(false)
            } else if (data.session) {
              console.log('Session set successfully, user can reset password')
              setTokenValid(true)
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname)
            }
          })
          return
        }
      }
    }
    
    // Check for token in query params (alternative format)
    if (token && type === 'recovery') {
      console.log('Found token in query params')
      setTokenValid(true)
    } else {
      // Check if we already have a session (user might have clicked link before)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          console.log('User has active session, can reset password')
          setTokenValid(true)
        } else {
          // No token or session - show request form
          console.log('No token found, showing request form')
          setTokenValid(null) // null means show request form
        }
      })
    }
  }, [searchParams, supabase])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRequestError(null)

    try {
      // Verify client is properly initialized
      if (!supabase) {
        throw new Error('Cliente de Supabase no inicializado')
      }

      // Use the correct redirect URL format
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/reset-password`
        : 'http://localhost:3000/auth/reset-password'
      
      console.log('Requesting password reset for:', requestEmail)
      console.log('Redirect URL:', redirectUrl)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(requestEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        console.error('Reset password email error:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Better error messages
        if (error.message.includes('Invalid API key')) {
          throw new Error('Error de configuración: API key inválida. Contacta al administrador.')
        } else if (error.message.includes('rate limit')) {
          throw new Error('Demasiados intentos. Espera unos minutos antes de intentar de nuevo.')
        } else {
          throw error
        }
      }

      console.log('Password reset email sent successfully')
      setRequestSent(true)
    } catch (err: any) {
      console.error('Request reset error:', err)
      setRequestError(err.message || 'Error al solicitar restablecimiento de contraseña')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      // Check if we have an active session (set from email link)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Error al verificar la sesión. El enlace puede haber expirado.')
      }

      if (!sessionData.session) {
        // Try to get from hash if session not set yet
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          
          if (accessToken && refreshToken) {
            console.log('Setting session from hash...')
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (setSessionError) {
              console.error('Error setting session:', setSessionError)
              throw new Error('Error al establecer sesión. El enlace puede haber expirado.')
            }
          } else {
            throw new Error('No se encontró token válido. Solicita un nuevo enlace de restablecimiento.')
          }
        } else {
          throw new Error('No se encontró sesión válida. Haz clic en el enlace del email nuevamente.')
        }
      }

      // Now update password (we have a session)
      console.log('Updating password...')
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        throw updateError
      }

      if (data.user) {
        console.log('Password updated successfully')
        setSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">¡Contraseña Actualizada!</h2>
            <p className="text-muted-foreground mb-4">
              Tu contraseña ha sido restablecida exitosamente. Redirigiendo al login...
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show request form if no token (user came from login page)
  if (tokenValid === null) {
    if (requestSent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Email Enviado</h2>
              <p className="text-muted-foreground mb-4">
                Hemos enviado un enlace de restablecimiento de contraseña a <strong>{requestEmail}</strong>.
                Revisa tu bandeja de entrada y haz clic en el enlace.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al login
              </Link>
            </div>
          </div>
        </div>
      )
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
            <h2 className="text-2xl font-semibold text-foreground mb-2">Restablecer Contraseña</h2>
            <p className="text-sm text-muted-foreground">Ingresa tu email para recibir el enlace de restablecimiento</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <form onSubmit={handleRequestReset} className="space-y-6">
              {requestError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{requestError}</span>
                </div>
              )}

              <div>
                <label htmlFor="requestEmail" className="block text-sm font-medium text-foreground mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="requestEmail"
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Enlace de Restablecimiento'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/auth/login" className="text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </Link>
          </p>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-semibold text-foreground mb-2">Restablecer Contraseña</h2>
          <p className="text-sm text-muted-foreground">Ingresa tu nueva contraseña</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || tokenValid === false}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/auth/login" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

