'use client'

import { useState, useMemo } from 'react'
import { ActivityItem } from '@/lib/types'
import { formatTimeAgo, formatDistance } from '@/lib/utils'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityTableProps {
  items: ActivityItem[]
  loading?: boolean
}

type SortField = 'timestamp' | 'location' | 'distance' | 'rssi'
type SortDirection = 'asc' | 'desc'

export default function ActivityTable({ items, loading }: ActivityTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Mask MAC address for privacy
  const maskMac = (mac: string) => {
    const parts = mac.split(':')
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:**:**:${parts[parts.length - 1]}`
    }
    return mac
  }

  const filteredAndSorted = useMemo(() => {
    let filtered = items

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        maskMac(item.mac).toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'timestamp') {
        aVal = new Date(a.timestamp).getTime()
        bVal = new Date(b.timestamp).getTime()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return sorted
  }, [items, searchQuery, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    )
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Actividad Reciente</h3>
          <p className="text-sm text-muted-foreground">
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'visita' : 'visitas'} encontradas
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID de visitante o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
          />
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No se encontraron visitas</p>
          {searchQuery && (
            <p className="text-xs mt-2">Intenta con otros términos de búsqueda</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Fecha/Hora
                    <SortIcon field="timestamp" />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ubicación
                    <SortIcon field="location" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                  ID de Visitante
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('distance')}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Distancia
                    <SortIcon field="distance" />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('rssi')}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Señal
                    <SortIcon field="rssi" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((item, index) => (
                <tr
                  key={`${item.mac}-${item.timestamp}-${index}`}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-foreground">
                    {formatTimeAgo(new Date(item.timestamp))}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {item.location}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-foreground">
                      {maskMac(item.mac)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatDistance(item.distance)}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {item.rssi} dBm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

