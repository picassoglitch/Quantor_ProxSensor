'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { createClient } from '@/lib/supabase-client'
import { Detection } from '@/lib/types'
import { TrendingUp } from 'lucide-react'

interface PeakHourChartProps {
  peakHour: number
  peakHourCount: number
  selectedLocation: string
  dateRange: string
}

export default function PeakHourChart({ peakHour, peakHourCount, selectedLocation, dateRange }: PeakHourChartProps) {
  const [hourlyData, setHourlyData] = useState<Array<{ hour: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchHourlyData()
  }, [selectedLocation, dateRange])

  async function fetchHourlyData() {
    setLoading(true)
    try {
      const now = new Date()
      const startDate = getStartDate(dateRange, now)

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
      const hourlyCounts = new Map<number, number>()

      detections.forEach(detection => {
        const hour = new Date(detection.created_at).getHours()
        hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + detection.devices.length)
      })

      const dataArray = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        count: hourlyCounts.get(i) || 0,
      }))

      setHourlyData(dataArray)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching hourly data:', error)
      setLoading(false)
    }
  }

  function getStartDate(range: string, now: Date): Date {
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const maxCount = Math.max(...hourlyData.map(d => d.count), 1)

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Hora Pico de Hoy</h3>
          <p className="text-sm text-muted-foreground">
            {peakHourCount > 0 ? `${peakHour}:00 con ${peakHourCount} detecciones` : 'No hay datos disponibles'}
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="hour"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {hourlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.count === maxCount
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--primary) / 0.6)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

