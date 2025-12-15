'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { createClient } from '@/lib/supabase-client'
import { Detection } from '@/lib/types'
import { Clock } from 'lucide-react'

interface EngagementChartsProps {
  selectedLocation: string
  dateRange: string
  loading?: boolean
}

export default function EngagementCharts({ selectedLocation, dateRange, loading }: EngagementChartsProps) {
  const [dwellDistribution, setDwellDistribution] = useState<Array<{ name: string; value: number }>>([])
  const [highInterestData, setHighInterestData] = useState<Array<{ range: string; count: number }>>([])
  const supabase = createClient()

  useEffect(() => {
    fetchEngagementData()
  }, [selectedLocation, dateRange])

  async function fetchEngagementData() {
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
      
      // Dwell time distribution
      const ranges = {
        '0-1 min': 0,
        '1-5 min': 0,
        '5-15 min': 0,
        '15-30 min': 0,
        '30+ min': 0,
      }

      const highInterestRanges = {
        '0-1m': 0,
        '1-5m': 0,
        '5-15m': 0,
        '15-30m': 0,
        '30m+': 0,
      }

      detections.forEach(detection => {
        detection.devices.forEach(device => {
          const minutes = device.duration / 60
          
          if (minutes < 1) {
            ranges['0-1 min']++
            highInterestRanges['0-1m']++
          } else if (minutes < 5) {
            ranges['1-5 min']++
            highInterestRanges['1-5m']++
          } else if (minutes < 15) {
            ranges['5-15 min']++
            highInterestRanges['5-15m']++
          } else if (minutes < 30) {
            ranges['15-30 min']++
            highInterestRanges['15-30m']++
          } else {
            ranges['30+ min']++
            highInterestRanges['30m+']++
          }
        })
      })

      setDwellDistribution(Object.entries(ranges).map(([name, value]) => ({ name, value })))
      setHighInterestData(Object.entries(highInterestRanges).map(([range, count]) => ({ range, count })))
    } catch (error) {
      console.error('Error fetching engagement data:', error)
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

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--primary) / 0.8)',
    'hsl(var(--primary) / 0.6)',
    'hsl(var(--primary) / 0.4)',
    'hsl(var(--primary) / 0.2)',
  ]

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dwell Time Distribution */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-4">Distribución de Tiempo de Permanencia</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={dwellDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dwellDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* High Interest Segment */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-4">Segmento de Alto Interés</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={highInterestData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="range"
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
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

