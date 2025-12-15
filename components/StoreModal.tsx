'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Store } from '@/lib/types'
import { X, Building2, MapPin, Radio } from 'lucide-react'

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  store: Store | null
  onSuccess: () => void
}

export default function StoreModal({ isOpen, onClose, store, onSuccess }: StoreModalProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [sensorId, setSensorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (store) {
      setName(store.name)
      setLocation(store.location)
      setSensorId(store.sensor_id || '')
    } else {
      setName('')
      setLocation('')
      setSensorId('')
    }
    setError(null)
  }, [store, isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (store) {
        // Update existing store
        const { error: updateError } = await (supabase
          .from('stores') as any)
          .update({
            name,
            location,
            sensor_id: sensorId || null,
          })
          .eq('id', (store as any).id)

        if (updateError) throw updateError
      } else {
        // Create new store
        const { error: insertError } = await supabase
          .from('stores')
          .insert({
            name,
            location,
            sensor_id: sensorId || null,
          } as any)

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar tienda')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {store ? 'Editar Tienda' : 'Nueva Tienda'}
          </h2>
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
            <label className="block text-sm font-medium mb-2">Nombre de la Tienda</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej: Tienda Centro"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ubicación (Location)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej: Entrance-01"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Debe coincidir con el LOCATION_NAME del sensor
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sensor ID (Opcional)</label>
            <div className="relative">
              <Radio className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={sensorId}
                onChange={(e) => setSensorId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                placeholder="SENSOR_XXXXXX"
              />
            </div>
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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

