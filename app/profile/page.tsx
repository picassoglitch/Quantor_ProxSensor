'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User, Settings, Save, LogOut, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser(profile)
      setFullName(profile.full_name || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error

      alert('Perfil actualizado correctamente')
      loadProfile()
    } catch (error: any) {
      alert('Error al actualizar perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 quantor-logo rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Mi Perfil</h1>
                <p className="text-xs text-muted-foreground">Gestiona tu información</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Admin
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Información del Perfil</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rol
              </label>
              <div className="px-4 py-2 bg-muted border border-input rounded-lg flex items-center gap-2">
                {user?.role === 'admin' && <Shield className="h-4 w-4 text-primary" />}
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {user?.role === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
                {user?.role === 'admin' && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Acceso completo al sistema
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

