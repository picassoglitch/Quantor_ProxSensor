'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User } from '@/lib/types'
import { ArrowLeft, Users, Eye, Building2 } from 'lucide-react'
import Link from 'next/link'
import Dashboard from '@/components/Dashboard'

export default function AdminClientsView() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    loadClients()
    
    // Check if clientId is in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const clientIdParam = urlParams.get('clientId')
    if (clientIdParam) {
      setSelectedClientId(clientIdParam)
    }
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || (profile as any).role !== 'admin') {
      router.push('/dashboard')
    } else {
      setCurrentUser(profile)
    }
  }

  async function loadClients() {
    setLoading(true)
    try {
      // Load only clients (not admins)
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (clientsData) {
        setClients(clientsData as User[])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If a client is selected, show their dashboard
  if (selectedClientId) {
    const selectedClient = clients.find(c => c.id === selectedClientId)
    return (
      <div className="min-h-screen bg-background">
        {/* Header with back button */}
        <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedClientId(null)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Clientes
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Dashboard de {selectedClient?.full_name || selectedClient?.email || 'Cliente'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Vista como cliente - {selectedClient?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Render dashboard filtered by this client */}
        <Dashboard clientId={selectedClientId || undefined} />
      </div>
    )
  }

  // Show clients list
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Admin
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Vista de Clientes</h1>
                <p className="text-xs text-muted-foreground">
                  Selecciona un cliente para ver su dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {clients.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay clientes registrados</h3>
            <p className="text-muted-foreground mb-6">
              Los clientes aparecerán aquí una vez que los crees desde el panel de administración.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ir al Panel de Admin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {client.full_name || 'Sin nombre'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{client.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Ver dashboard</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}





