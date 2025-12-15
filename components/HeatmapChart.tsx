'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Detection } from '@/lib/types'
import { Calendar } from 'lucide-react'

interface HeatmapChartProps {
  selectedLocation: string
  dateRange: string
}

interface HeatmapData {
  day: string
  hour: number
  count: number
}

export default function HeatmapChart({ selectedLocation, dateRange }: HeatmapChartProps) {
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [maxCount, setMaxCount] = useState(1)
  const supabase = createClient()

  useEffect(() => {
    fetchHeatmapData()
  }, [selectedLocation, dateRange])

  async function fetchHeatmapData() {
    setLoading(true)
    try {
      const now = new Date()
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days

      let query = supabase
        .from('detections')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (selectedLocation !== 'all') {
        query = query.eq('location', selectedLocation)
      }

      const { data, error } = await query

      if (error) throw error

      const detections = (data || []) as Detection[]
      const dataMap = new Map<string, number>()

      detections.forEach(detection => {
        const date = new Date(detection.created_at)
        const day = date.toLocaleDateString('es-ES', { weekday: 'short' })
        const hour = date.getHours()
        const key = `${day}-${hour}`

        dataMap.set(key, (dataMap.get(key) || 0) + detection.devices.length)
      })

      setHeatmapData(dataMap)
      setMaxCount(Math.max(...Array.from(dataMap.values()), 1))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching heatmap data:', error)
      setLoading(false)
    }
  }

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  function getIntensity(key: string): string {
    const count = heatmapData.get(key) || 0
    if (count === 0) return 'bg-muted'
    const intensity = count / maxCount
    if (intensity > 0.7) return 'bg-primary'
    if (intensity > 0.4) return 'bg-primary/70'
    if (intensity > 0.2) return 'bg-primary/50'
    return 'bg-primary/30'
  }

  function getTooltip(key: string): string {
    const count = heatmapData.get(key) || 0
    const [day, hour] = key.split('-')
    return `${day} ${hour}:00 - ${count} detecciones`
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Mapa de Calor de Actividad</h3>
          <p className="text-sm text-muted-foreground">Últimos 7 días por hora</p>
        </div>
        <Calendar className="h-5 w-5 text-primary" />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  {hours.map((hour) => (
                    <th
                      key={hour}
                      className="text-xs text-muted-foreground text-center py-2 px-1"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                      {hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td className="text-xs font-medium text-foreground py-2 pr-2 text-right">
                      {day}
                    </td>
                    {hours.map((hour) => {
                      const key = `${day}-${hour}`
                      return (
                        <td key={key} className="p-0.5">
                          <div
                            className={`w-4 h-4 rounded ${getIntensity(key)} transition-all hover:scale-110 cursor-pointer`}
                            title={getTooltip(key)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded bg-primary/30"></div>
                <div className="w-3 h-3 rounded bg-primary/50"></div>
                <div className="w-3 h-3 rounded bg-primary/70"></div>
                <div className="w-3 h-3 rounded bg-primary"></div>
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

