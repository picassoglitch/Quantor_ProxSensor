'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { createClient } from '@/lib/supabase-client'
import { Detection } from '@/lib/types'
import { Users, Smartphone } from 'lucide-react'

interface AudienceSegmentsProps {
  selectedLocation: string
  dateRange: string
  loading?: boolean
}

export default function AudienceSegments({ selectedLocation, dateRange, loading }: AudienceSegmentsProps) {
  const [newVsReturning, setNewVsReturning] = useState<Array<{ name: string; value: number }>>([])
  const [deviceTypes, setDeviceTypes] = useState<Array<{ name: string; value: number }>>([])
  const supabase = createClient()

  useEffect(() => {
    fetchAudienceData()
  }, [selectedLocation, dateRange])

  async function fetchAudienceData() {
    try {
      const now = new Date()
      const startDate = getStartDate(dateRange, now)
      const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))

      let query = supabase
        .from('detections')
        .select('*')
        .gte('created_at', previousPeriodStart.toISOString())
        .order('created_at', { ascending: false })

      if (selectedLocation !== 'all') {
        query = query.eq('location', selectedLocation)
      }

      const { data, error } = await query
      if (error) throw error

      const allDetections = (data || []) as Detection[]
      const currentPeriodDetections = allDetections.filter(
        d => new Date(d.created_at) >= startDate
      )
      const previousPeriodDetections = allDetections.filter(
        d => new Date(d.created_at) < startDate && new Date(d.created_at) >= previousPeriodStart
      )

      // New vs Returning
      const currentVisitors = new Set<string>()
      const previousVisitors = new Set<string>()
      
      currentPeriodDetections.forEach(d => {
        d.devices.forEach(dev => currentVisitors.add(dev.mac))
      })
      
      previousPeriodDetections.forEach(d => {
        d.devices.forEach(dev => previousVisitors.add(dev.mac))
      })

      const newVisitors = Array.from(currentVisitors).filter(mac => !previousVisitors.has(mac)).length
      const returningVisitors = Array.from(currentVisitors).filter(mac => previousVisitors.has(mac)).length

      setNewVsReturning([
        { name: 'Nuevos', value: newVisitors },
        { name: 'Recurrentes', value: returningVisitors },
      ])

      // Device types (simplified - using MAC prefix patterns)
      const deviceTypeCounts: Record<string, number> = {}
      currentPeriodDetections.forEach(d => {
        d.devices.forEach(dev => {
          // Simple heuristic: check MAC prefix patterns
          const prefix = dev.mac.split(':')[0]
          let type = 'Otro'
          
          // Common patterns (simplified)
          if (['00', '08', '0c', '10', '14', '18', '1c', '20', '24', '28', '2c', '30', '34', '38', '3c', '40', '44', '48', '4c', '50', '54', '58', '5c', '60', '64', '68', '6c', '70', '74', '78', '7c', '80', '84', '88', '8c', '90', '94', '98', '9c', 'a0', 'a4', 'a8', 'ac', 'b0', 'b4', 'b8', 'bc', 'c0', 'c4', 'c8', 'cc', 'd0', 'd4', 'd8', 'dc', 'e0', 'e4', 'e8', 'ec', 'f0', 'f4', 'f8', 'fc'].includes(prefix.toLowerCase())) {
            type = 'Móvil'
          }
          
          deviceTypeCounts[type] = (deviceTypeCounts[type] || 0) + 1
        })
      })

      setDeviceTypes(Object.entries(deviceTypeCounts).map(([name, value]) => ({ name, value })))
    } catch (error) {
      console.error('Error fetching audience data:', error)
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

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.6)']

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New vs Returning */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Nuevos vs Visitantes Recurrentes</h4>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={newVsReturning}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {newVsReturning.map((entry, index) => (
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
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Device Types */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Tipos de Dispositivos</h4>
        </div>
        <div className="space-y-2">
          {deviceTypes.map((type, index) => (
            <div key={type.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-foreground">{type.name}</span>
              <span className="text-sm font-medium text-foreground">{type.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

