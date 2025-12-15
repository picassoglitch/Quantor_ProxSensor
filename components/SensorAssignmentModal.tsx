'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User, Sensor } from '@/lib/types'
import { X, User as UserIcon, Radio } from 'lucide-react'

interface SensorAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  sensor: Sensor | null
  onSuccess: () => void
}

export default function SensorAssignmentModal({ isOpen, onClose, sensor, onSuccess }: SensorAssignmentModalProps) {
  const [clients, setClients] = useState<User[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && sensor) {
      loadData()
      setSelectedClient(sensor.client_id || '')
    }
  }, [isOpen, sensor])

  async function loadData() {
    // Load clients
    const { data: clientsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name', { ascending: true })

    if (clientsData) setClients(clientsData as User[])
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sensor) return
    
    setLoading(true)
    setError(null)

    try {
      // Update the store's client_id if there's a matching store
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('location', sensor.location)
        .limit(1)

      if (stores && stores.length > 0) {
        // Update store's client_id
        const { error: updateError } = await supabase
          .from('stores')
          .update({ client_id: selectedClient || null })
          .eq('id', stores[0].id)

        if (updateError) throw updateError
      } else {
        // Create a new store for this sensor if it doesn't exist
        const { error: insertError } = await supabase
          .from('stores')
          .insert({
            name: sensor.location,
            location: sensor.location,
            sensor_id: sensor.sensor_id,
            client_id: selectedClient || null,
          })

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al asignar sensor')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !sensor) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Asignar Sensor a Cliente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Sensor</label>
            <div className="bg-muted px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm font-mono">{sensor.sensor_id}</code>
              </div>
              <p className="text-sm text-muted-foreground">{sensor.location}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cliente</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin asignar</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || client.email}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Selecciona un cliente para asignar este sensor, o deja en blanco para desasignar
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-background border border-input rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

