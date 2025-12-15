'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User, Store, ClientStore, Sensor } from '@/lib/types'
import { Users, Building2, Link2, Settings, LogOut, Plus, Trash2, Edit2, User as UserIcon, BarChart3, Shield, Eye, LayoutDashboard, Radio, Activity, AlertCircle, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import UserModal from '@/components/UserModal'
import StoreModal from '@/components/StoreModal'
import AssignmentModal from '@/components/AssignmentModal'
import SensorAssignmentModal from '@/components/SensorAssignmentModal'
import Dashboard from '@/app/page'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stores' | 'assignments' | 'sensors'>('overview')
  const [showClientsView, setShowClientsView] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [assignments, setAssignments] = useState<Array<ClientStore & { client_name: string; store_name: string }>>([])
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showSensorAssignmentModal, setShowSensorAssignmentModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  useEffect(() => {
    if (loading) return

    // Set up real-time subscription for sensor updates
    const channel = supabase
      .channel('sensor-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'detections' },
        () => {
          // Refresh sensor status when new detection is inserted
          loadSensorStatus()
        }
      )
      .subscribe()

    // Refresh sensor status every 10 seconds for more real-time updates
    const interval = setInterval(() => {
      loadSensorStatus()
    }, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [loading])

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

  async function loadData() {
    setLoading(true)
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersData) setUsers(usersData as User[])

      // Load stores
      const { data: storesData } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })

      if (storesData) setStores(storesData as Store[])

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from('client_stores')
        .select(`
          *,
          profiles!client_stores_client_id_fkey(full_name),
          stores!client_stores_store_id_fkey(name)
        `)

      if (assignmentsData) {
        const formatted = assignmentsData.map((a: any) => ({
          ...a,
          client_name: a.profiles?.full_name || 'Sin nombre',
          store_name: a.stores?.name || 'Sin nombre',
        }))
        setAssignments(formatted)
      }

      // Load sensor status
      await loadSensorStatus()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSensorStatus() {
    try {
      // Get all unique sensors from detections in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: recentDetections } = await supabase
        .from('detections')
        .select('sensor_id, location, created_at, wifi_rssi, devices')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })

      if (!recentDetections) return

      // Group by sensor_id
      const sensorMap = new Map<string, any>()
      
      recentDetections.forEach((detection: any) => {
        const sensorId = detection.sensor_id
        if (!sensorMap.has(sensorId)) {
          sensorMap.set(sensorId, {
            sensor_id: sensorId,
            location: detection.location,
            detections: [],
            last_seen: null,
            total_devices: 0,
            wifi_rssi_sum: 0,
            wifi_rssi_count: 0,
          })
        }
        
        const sensor = sensorMap.get(sensorId)
        sensor.detections.push(detection)
        if (!sensor.last_seen || detection.created_at > sensor.last_seen) {
          sensor.last_seen = detection.created_at
        }
        if (detection.devices && Array.isArray(detection.devices)) {
          sensor.total_devices += detection.devices.length
        }
        if (detection.wifi_rssi) {
          sensor.wifi_rssi_sum += detection.wifi_rssi
          sensor.wifi_rssi_count++
        }
      })

      // Convert to Sensor array with status
      const now = Date.now()
      const sensorsData: Sensor[] = Array.from(sensorMap.values()).map((s: any) => {
        const lastSeen = s.last_seen ? new Date(s.last_seen).getTime() : 0
        const secondsAgo = lastSeen ? Math.floor((now - lastSeen) / 1000) : Infinity
        
        // Determine status based on time since last detection
        // Sensors typically send data every 5-30 seconds
        // Online: received data in last 2 minutes (allows for network delays and retries)
        // Standby: 2-4 minutes (normal interval between batches, not offline)
        // Error: 4-15 minutes (likely problem but might recover)
        // Offline: more than 15 minutes (definitely offline)
        let status: 'online' | 'standby' | 'offline' | 'error' | 'unknown' = 'unknown'
        if (secondsAgo < 120) {  // Less than 2 minutes = online
          status = 'online'
        } else if (secondsAgo < 240) {  // 2-4 minutes = standby (normal interval between batches)
          status = 'standby'
        } else if (secondsAgo < 900) {  // 4-15 minutes = error (likely problem)
          status = 'error'
        } else {  // More than 15 minutes = offline
          status = 'offline'
        }

        // Find matching store
        const store = stores.find(st => st.location === s.location || st.sensor_id === s.sensor_id)
        
        // Calculate metrics
        const hoursAgo = secondsAgo / 3600
        const avgDevicesPerHour = hoursAgo > 0 ? s.total_devices / hoursAgo : s.total_devices
        const uptimePercent = hoursAgo < 24 ? Math.max(0, 100 - (secondsAgo / 60 / 24 * 100)) : 0

        return {
          sensor_id: s.sensor_id,
          location: s.location,
          store_name: store?.name,
          store_id: store?.id,
          client_id: store?.client_id,
          status,
          last_seen: s.last_seen,
          last_seen_ago: secondsAgo,
          device_count: s.detections[0]?.devices?.length || 0,
          total_detections: s.detections.length,
          error_count: 0, // Could track HTTP errors if we add error logging
          wifi_rssi: s.wifi_rssi_count > 0 ? Math.round(s.wifi_rssi_sum / s.wifi_rssi_count) : null,
          uptime_percent: Math.round(uptimePercent),
          avg_devices_per_hour: Math.round(avgDevicesPerHour * 10) / 10,
        }
      })

      setSensors(sensorsData)
    } catch (error) {
      console.error('Error loading sensor status:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (!error) {
      await supabase.auth.admin.deleteUser(userId)
      loadData()
    }
  }

  async function handleDeleteStore(storeId: string) {
    if (!confirm('¿Estás seguro de eliminar esta tienda?')) return

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (!error) {
      loadData()
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return

    const { error } = await supabase
      .from('client_stores')
      .delete()
      .eq('id', assignmentId)

    if (!error) {
      loadData()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 quantor-logo rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Quantor Admin</h1>
                <p className="text-xs text-muted-foreground">Panel de Administración</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Administrador</span>
                </div>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'stores'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Asignaciones
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'sensors'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Sensores
            </div>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="bg-card border border-border rounded-xl p-6 hover:bg-accent transition-colors text-left w-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Total Usuarios</h3>
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{users.length}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {users.filter(u => u.role === 'admin').length} admin, {users.filter(u => u.role === 'client').length} clientes
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('stores')}
                    className="bg-card border border-border rounded-xl p-6 hover:bg-accent transition-colors text-left w-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Total de Clientes</h3>
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {users.filter(u => u.role === 'client').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click para ver dashboards de clientes
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="bg-card border border-border rounded-xl p-6 hover:bg-accent transition-colors text-left w-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Asignaciones</h3>
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{assignments.length}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cliente-Tienda activas
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('sensors')}
                    className="bg-card border border-border rounded-xl p-6 hover:bg-accent transition-colors text-left w-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Sensores Activos</h3>
                      <Radio className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{sensors.filter(s => s.status === 'online').length}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {sensors.length} total, {sensors.filter(s => s.status === 'offline' || s.status === 'error').length} offline
                    </p>
                  </button>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Clients View Mode */}
                {showClientsView ? (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold">Dashboards de Clientes</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Selecciona un cliente para ver su dashboard
                        </p>
                      </div>
                      <button
                        onClick={() => setShowClientsView(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
                      >
                        Ver Todos los Usuarios
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.filter(u => u.role === 'client').map((client) => (
                        <Link
                          key={client.id}
                          href={`/admin/clients?clientId=${client.id}`}
                          className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{client.full_name || 'Sin nombre'}</h3>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{client.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                              Cliente
                            </span>
                            <span>
                              Creado: {new Date(client.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </Link>
                      ))}
                      {users.filter(u => u.role === 'client').length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No hay clientes registrados</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* All Users Management View */
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                      <button
                        onClick={() => {
                          setEditingUser(null)
                          setShowUserModal(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Nuevo Usuario
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nombre</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rol</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Creado</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 px-4 text-sm">{user.email}</td>
                              <td className="py-3 px-4 text-sm">{user.full_name || '-'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'admin' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-secondary text-secondary-foreground'
                                }`}>
                                  {user.role === 'admin' ? 'Admin' : 'Cliente'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString('es-ES')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  {user.role === 'client' && (
                                    <Link
                                      href={`/admin/clients?clientId=${user.id}`}
                                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                                      title="Ver Dashboard"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingUser(user)
                                      setShowUserModal(true)
                                    }}
                                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stores' && (
              <>
                {selectedClientId ? (
                  // Show client dashboard
                  <div className="min-h-screen bg-background">
                    <div className="bg-card border border-border rounded-xl p-6 mb-6">
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
                              Dashboard de {users.find(u => u.id === selectedClientId)?.full_name || users.find(u => u.id === selectedClientId)?.email || 'Cliente'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                              Vista como cliente - {users.find(u => u.id === selectedClientId)?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Dashboard clientId={selectedClientId} />
                  </div>
                ) : (
                  // Show clients list
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold">Dashboards de Clientes</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Selecciona un cliente para ver su dashboard
                        </p>
                      </div>
                    </div>
                    {users.filter(u => u.role === 'client').length === 0 ? (
                      <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay clientes registrados</h3>
                        <p className="text-muted-foreground mb-6">
                          Los clientes aparecerán aquí una vez que los crees desde el panel de administración.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.filter(u => u.role === 'client').map((client) => (
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
                  </div>
                )}
              </>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Asignaciones Cliente-Tienda</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Controla qué clientes pueden ver datos de qué sensores/tiendas
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAssignmentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Nueva Asignación
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tienda</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ubicación</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asignado</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              No hay asignaciones. Crea una para permitir que un cliente vea datos de una tienda.
                            </td>
                          </tr>
                        ) : (
                          assignments.map((assignment) => {
                            const client = users.find(u => u.id === assignment.client_id)
                            const store = stores.find(s => s.id === assignment.store_id)
                            return (
                              <tr key={assignment.id} className="border-b border-border hover:bg-muted/50">
                                <td className="py-3 px-4 text-sm font-medium">{assignment.client_name}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{client?.email || '-'}</td>
                                <td className="py-3 px-4 text-sm">{assignment.store_name}</td>
                                <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{store?.location || '-'}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                  {new Date(assignment.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors ml-auto"
                                    title="Eliminar asignación"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista por Cliente */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Vista por Cliente</h3>
                  <div className="space-y-4">
                    {users.filter(u => u.role === 'client').map((client) => {
                      const clientAssignments = assignments.filter(a => a.client_id === client.id)
                      return (
                        <div key={client.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{client.full_name || 'Sin nombre'}</h4>
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            </div>
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                              {clientAssignments.length} {clientAssignments.length === 1 ? 'tienda' : 'tiendas'}
                            </span>
                          </div>
                          {clientAssignments.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {clientAssignments.map((assignment) => {
                                const store = stores.find(s => s.id === assignment.store_id)
                                return (
                                  <span
                                    key={assignment.id}
                                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                                  >
                                    {assignment.store_name} ({store?.location})
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-2">
                              Este cliente no tiene acceso a ninguna tienda
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Asignación de Sensores a Clientes */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Asignar Sensores a Clientes</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Asigna sensores directamente a clientes para que puedan ver sus datos
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sensors.map((sensor) => {
                      const client = sensor.client_id ? users.find(u => u.id === sensor.client_id) : null
                      return (
                        <div
                          key={sensor.sensor_id}
                          className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded block mb-1">
                                {sensor.sensor_id}
                              </code>
                              <p className="text-sm font-medium">{sensor.location}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sensor.status === 'online' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {sensor.status === 'online' ? 'En línea' : 'Offline'}
                            </div>
                          </div>
                          {client ? (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground mb-1">Asignado a:</p>
                              <p className="text-sm font-medium">{client.full_name || client.email}</p>
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">Sin asignar</p>
                              <button
                                onClick={() => {
                                  setEditingSensor(sensor)
                                  setShowSensorAssignmentModal(true)
                                }}
                                className="text-xs text-primary hover:underline mt-1"
                              >
                                Asignar cliente
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {sensors.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay sensores detectados aún</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sensors' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Sensores</span>
                      <Radio className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{sensors.length}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">En Línea</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {sensors.filter(s => s.status === 'online').length}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">En Standby</span>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-500">
                      {sensors.filter(s => s.status === 'standby').length}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Desconectados</span>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-500">
                      {sensors.filter(s => s.status === 'offline' || s.status === 'error').length}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Con Errores</span>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">
                      {sensors.filter(s => s.status === 'error').length}
                    </p>
                  </div>
                </div>

                {/* Sensors Table */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Estado de Sensores</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monitoreo en tiempo real del estado de todos los sensores
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        loadSensorStatus()
                        loadData()
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent transition-colors"
                    >
                      <Activity className="h-4 w-4" />
                      Actualizar
                    </button>
                  </div>

                  {sensors.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay sensores detectados aún</p>
                      <p className="text-sm mt-2">Los sensores aparecerán aquí después de enviar datos</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sensor ID</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ubicación</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tienda</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Última Actividad</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dispositivos</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Detecciones</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">WiFi RSSI</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Uptime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sensors.map((sensor) => {
                            const StatusIcon = sensor.status === 'online' 
                              ? CheckCircle2 
                              : sensor.status === 'standby'
                              ? Clock
                              : sensor.status === 'error' 
                              ? AlertCircle 
                              : XCircle
                            const statusColor = sensor.status === 'online' 
                              ? 'text-green-500' 
                              : sensor.status === 'standby'
                              ? 'text-blue-500'
                              : sensor.status === 'error' 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                            const statusBg = sensor.status === 'online' 
                              ? 'bg-green-500/10' 
                              : sensor.status === 'standby'
                              ? 'bg-blue-500/10'
                              : sensor.status === 'error' 
                              ? 'bg-yellow-500/10' 
                              : 'bg-red-500/10'

                            const formatTimeAgo = (seconds: number) => {
                              if (seconds < 60) return `${seconds}s`
                              if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
                              if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
                              return `${Math.floor(seconds / 86400)}d`
                            }

                            const statusLabel = sensor.status === 'online' 
                              ? 'En Línea' 
                              : sensor.status === 'standby'
                              ? 'Standby'
                              : sensor.status === 'error' 
                              ? 'Error' 
                              : 'Desconectado'

                            return (
                              <tr key={sensor.sensor_id} className="border-b border-border hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit ${statusBg}`}>
                                    <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                                    <span className={`text-xs font-medium ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                    {sensor.sensor_id}
                                  </code>
                                </td>
                                <td className="py-3 px-4 text-sm font-medium">{sensor.location}</td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm">{sensor.store_name || '-'}</span>
                                    {sensor.client_id && (
                                      <span className="text-xs text-muted-foreground">
                                        Cliente: {users.find(u => u.id === sensor.client_id)?.full_name || users.find(u => u.id === sensor.client_id)?.email || 'Desconocido'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm">
                                        {sensor.last_seen 
                                          ? formatTimeAgo(sensor.last_seen_ago)
                                          : 'Nunca'}
                                      </div>
                                      {sensor.last_seen && (
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(sensor.last_seen).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{sensor.device_count}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({sensor.avg_devices_per_hour}/h)
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                  {sensor.total_detections} últimas 24h
                                </td>
                                <td className="py-3 px-4">
                                  {sensor.wifi_rssi !== null ? (
                                    <span className={`text-sm font-medium ${
                                      sensor.wifi_rssi > -70 ? 'text-green-500' :
                                      sensor.wifi_rssi > -85 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                      {sensor.wifi_rssi} dBm
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${
                                          sensor.uptime_percent > 90 ? 'bg-green-500' :
                                          sensor.uptime_percent > 70 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${sensor.uptime_percent}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {sensor.uptime_percent}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <UserModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false)
            setEditingUser(null)
          }}
          user={editingUser}
          onSuccess={loadData}
        />

        <StoreModal
          isOpen={showStoreModal}
          onClose={() => {
            setShowStoreModal(false)
            setEditingStore(null)
          }}
          store={editingStore}
          onSuccess={loadData}
        />

        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={loadData}
        />

        <SensorAssignmentModal
          isOpen={showSensorAssignmentModal}
          onClose={() => {
            setShowSensorAssignmentModal(false)
            setEditingSensor(null)
          }}
          sensor={editingSensor}
          onSuccess={() => {
            loadData()
            loadSensorStatus()
          }}
        />
      </main>
    </div>
  )
}

