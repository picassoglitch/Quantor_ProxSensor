'use client'

import { useEffect, useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { createClient } from '@/lib/supabase-client'
import { Detection } from '@/lib/types'
import { TrendingUp } from 'lucide-react'

interface TrafficTimelineProps {
  selectedLocation: string
  dateRange: string
  loading?: boolean
}

export default function TrafficTimeline({ selectedLocation, dateRange, loading }: TrafficTimelineProps) {
  const [timelineData, setTimelineData] = useState<Array<{ time: string; visitantes: number }>>([])
  const [peakSummary, setPeakSummary] = useState<{ hour: number; count: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchTimelineData()
  }, [selectedLocation, dateRange])

  async function fetchTimelineData() {
    try {
      const now = new Date()
      const startDate = getStartDate(dateRange, now)

      let query = supabase
        .from('detections')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (selectedLocation !== 'all') {
        query = query.eq('location', selectedLocation)
      }

      const { data, error } = await query
      if (error) throw error

      const detections = (data || []) as Detection[]
      
      // Group by hour
      const hourlyData = new Map<string, number>()
      detections.forEach(detection => {
        const date = new Date(detection.created_at)
        const hour = date.getHours()
        const key = `${hour}:00`
        hourlyData.set(key, (hourlyData.get(key) || 0) + detection.devices.length)
      })

      const sortedData = Array.from(hourlyData.entries())
        .map(([time, visitantes]) => ({ time, visitantes }))
        .sort((a, b) => a.time.localeCompare(b.time))

      setTimelineData(sortedData)

      // Find peak
      let peakHour = 0
      let peakCount = 0
      hourlyData.forEach((count, time) => {
        if (count > peakCount) {
          peakCount = count
          peakHour = parseInt(time.split(':')[0])
        }
      })
      setPeakSummary({ hour: peakHour, count: peakCount })
    } catch (error) {
      console.error('Error fetching timeline data:', error)
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

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {peakSummary && peakSummary.count > 0 && (
        <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Hora pico: {peakSummary.hour}:00
              </p>
              <p className="text-xs text-muted-foreground">
                {peakSummary.count} visitantes en esa hora
              </p>
            </div>
          </div>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis
            dataKey="time"
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
          <Line
            type="monotone"
            dataKey="visitantes"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            name="Visitantes"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

