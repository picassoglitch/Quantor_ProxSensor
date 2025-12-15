'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Detection, Device, MarketingStats, ActivityItem, Insight } from '@/lib/types'
import DashboardHeader from '@/components/DashboardHeader'
import KpiCard from '@/components/KpiCard'
import SectionCard from '@/components/SectionCard'
import ViewToggle, { ViewMode } from '@/components/ViewToggle'
import InsightsPanel from '@/components/InsightsPanel'
import ExportBar from '@/components/ExportBar'
import ActivityTable from '@/components/ActivityTable'
import TrafficTimeline from '@/components/TrafficTimeline'
import EngagementCharts from '@/components/EngagementCharts'
import AudienceSegments from '@/components/AudienceSegments'
import PeakHourChart from '@/components/PeakHourChart'
import HeatmapChart from '@/components/HeatmapChart'
import Footer from '@/components/Footer'
import { Users, Clock, TrendingUp, Calendar, Target, BarChart3 } from 'lucide-react'
import { generateInsights, calculateEngagementScore } from '@/lib/insights'
import { exportToCSV, exportToPDF } from '@/lib/export'

interface DashboardProps {
  clientId?: string
}

export default function Dashboard({ clientId }: DashboardProps) {
  const [locations, setLocations] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'custom'>('today')
  const [viewMode, setViewMode] = useState<ViewMode>('executive')
  const [stats, setStats] = useState<MarketingStats | null>(null)
  const [previousStats, setPreviousStats] = useState<MarketingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [clientStores, setClientStores] = useState<string[]>([])
  const supabase = createClient()

  // Check if user is admin and redirect (unless admin is viewing client view)
  useEffect(() => {
    async function checkUserRole() {
      // Check if admin is viewing client dashboard (via query param)
      const urlParams = new URLSearchParams(window.location.search)
      const isAdminView = urlParams.get('admin') === 'true'
      
      if (isAdminView) {
        // Admin is viewing client dashboard, don't redirect
        return
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile && (profile as any).role === 'admin' && !clientId) {
          window.location.href = '/admin'
        }
      }
    }
    if (!clientId) {
      checkUserRole()
    }
  }, [clientId, supabase])

  // Fetch all locations
  useEffect(() => {
    fetchLocations()
    if (clientId) {
      fetchClientStores()
    }
  }, [clientId])
  
  async function fetchClientStores() {
    if (!clientId) return
    
    try {
      // Method 1: Get stores assigned to this client via client_stores
      const { data: storeAssignments } = await supabase
        .from('client_stores')
        .select('stores(location)')
        .eq('client_id', clientId)
      
      const assignedLocations = storeAssignments
        ?.map((item: any) => item.stores?.location)
        .filter(Boolean) || []

      // Method 2: Get locations where client_id matches directly in detections
      const { data: directLocations } = await supabase
        .from('detections')
        .select('location')
        .eq('client_id', clientId)
        .limit(1000)
      
      const uniqueDirectLocations = [...new Set(
        directLocations?.map((d: any) => d.location).filter(Boolean) || []
      )]

      // Combine both methods
      const allClientLocations = [...new Set([...assignedLocations, ...uniqueDirectLocations])]
      
      setClientStores(allClientLocations)
      
      // Filter locations to only show client's accessible locations
      if (allClientLocations.length > 0) {
        setLocations(prev => {
          const filtered = prev.filter(loc => allClientLocations.includes(loc))
          return filtered.length > 0 ? filtered : allClientLocations
        })
      }
    } catch (error) {
      console.error('Error fetching client stores:', error)
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('detections-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detections',
        },
        (payload) => {
          handleNewDetection(payload.new as Detection)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedLocation, supabase])

  // Fetch data when filters change
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [selectedLocation, dateRange])

  // Generate insights when stats change
  useEffect(() => {
    if (stats) {
      const newInsights = generateInsights(stats, previousStats || undefined)
      setInsights(newInsights)
    }
  }, [stats, previousStats])

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  async function fetchLocations() {
    try {
      let query = supabase
        .from('detections')
        .select('location')
        .order('created_at', { ascending: false })
        .limit(1000)

      // Filter by client stores if clientId is provided, otherwise fetch all
      if (clientId) {
        if (clientStores.length > 0) {
          query = query.in('location', clientStores)
        } else {
          // If clientId is provided but no stores are assigned, show no locations
          setLocations([])
          return
        }
      }
      // If no clientId, fetch all locations (for admin's full view)

      const { data, error } = await query
      if (error) throw error

      const uniqueLocations = Array.from(new Set((data || []).map((d: any) => d.location).filter(Boolean)))
      setLocations(uniqueLocations)
      if (uniqueLocations.length > 0 && selectedLocation === 'all') {
        setSelectedLocation(uniqueLocations[0])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1)
          startDate.setHours(0, 0, 0, 0)
          break
        case '7days':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30days':
          startDate.setDate(startDate.getDate() - 30)
          break
      }

      let query = supabase
        .from('detections')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Filter by client stores if clientId is provided, otherwise fetch all
      if (clientId) {
        if (clientStores.length > 0) {
          query = query.in('location', clientStores)
        } else {
          // If clientId is provided but no stores are assigned, return empty data
          setStats(null)
          setActivity([])
          setLoading(false)
          return
        }
      }

      if (selectedLocation !== 'all') {
        query = query.eq('location', selectedLocation)
      }

      const { data: detections, error } = await query
      if (error) throw error

      // Process data
      const processed = processDetections(detections || [])
      setStats(processed.stats)
      setPreviousStats(processed.previousStats)
      setActivity(processed.activity)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  function processDetections(detections: Detection[]) {
    // Group by device fingerprint for unique visitors
    const deviceMap = new Map<string, { firstSeen: Date; lastSeen: Date; visits: number }>()
    const locationStats: Record<string, { count: number; devices: Set<string> }> = {}
    const hourlyData: Record<number, number> = {}
    const deviceTypes: Record<string, number> = {}
    let totalDwellTime = 0
    let totalDevices = 0

    detections.forEach((detection) => {
      const location = detection.location || 'Unknown'
      if (!locationStats[location]) {
        locationStats[location] = { count: 0, devices: new Set() }
      }

      if (detection.devices && Array.isArray(detection.devices)) {
        detection.devices.forEach((device: Device) => {
          const fp = device.fp || device.mac
          if (!deviceMap.has(fp)) {
            deviceMap.set(fp, {
              firstSeen: new Date(detection.created_at),
              lastSeen: new Date(detection.created_at),
              visits: 1,
            })
          } else {
            const deviceData = deviceMap.get(fp)!
            const currentTime = new Date(detection.created_at)
            if (currentTime.getTime() - deviceData.lastSeen.getTime() > 30 * 60 * 1000) {
              // New visit if more than 30 minutes apart
              deviceData.visits++
            }
            deviceData.lastSeen = currentTime
          }

          locationStats[location].devices.add(fp)
          locationStats[location].count++
          totalDwellTime += device.duration || 0
          totalDevices++

          // Device type detection (simplified)
          const deviceType = 'Mobile' // Could be enhanced with OUI lookup
          deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1
        })
      }

      // Hourly data
      const hour = new Date(detection.created_at).getHours()
      hourlyData[hour] = (hourlyData[hour] || 0) + (detection.devices?.length || 0)
    })

    // Calculate previous period stats for comparison
    const now = new Date()
    const previousStart = new Date(now)
    previousStart.setDate(previousStart.getDate() - (dateRange === 'today' ? 1 : dateRange === '7days' ? 14 : 60))
    const previousEnd = new Date(now)
    previousEnd.setDate(previousEnd.getDate() - (dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : 30))

    // This would require another query, simplified for now
    const previousStats: MarketingStats = {
      location: selectedLocation === 'all' ? 'Todas las Ubicaciones' : selectedLocation,
      liveCount: 0,
      uniqueToday: 0,
      uniqueThisWeek: 0,
      uniqueThisMonth: 0,
      avgDwellTime: 0,
      peakHour: 0,
      peakHourCount: 0,
      returningVisitorsPercent: 0,
      engagementScore: 0,
      changeVsYesterday: { visitors: 0, dwellTime: 0, engagement: 0 },
      newVisitors: 0,
      returningVisitors: 0,
      deviceTypes: {},
    }

    const uniqueDevices = deviceMap.size
    const returningDevices = Array.from(deviceMap.values()).filter((d) => d.visits > 1).length
    const avgDwell = totalDevices > 0 ? totalDwellTime / totalDevices : 0
    const peakHour = Object.entries(hourlyData).reduce((a, b) => ((hourlyData as any)[a[0]] > (hourlyData as any)[b[0]] ? a : b), ['0', 0])[0]

    const stats: MarketingStats = {
      location: selectedLocation === 'all' ? 'All Locations' : selectedLocation,
      liveCount: totalDevices,
      uniqueToday: uniqueDevices,
      uniqueThisWeek: uniqueDevices,
      uniqueThisMonth: uniqueDevices,
      avgDwellTime: avgDwell,
      peakHour: parseInt(peakHour),
      peakHourCount: (hourlyData as any)[parseInt(peakHour)] || 0,
      returningVisitorsPercent: uniqueDevices > 0 ? (returningDevices / uniqueDevices) * 100 : 0,
      engagementScore: 0, // Will be calculated below
      changeVsYesterday: {
        visitors: 0, // Would need previous data
        dwellTime: 0,
        engagement: 0,
      },
      newVisitors: uniqueDevices - returningDevices,
      returningVisitors: returningDevices,
      deviceTypes,
    }
    
    // Calculate engagement score after stats object is created
    stats.engagementScore = calculateEngagementScore(stats)

    // Activity items
    const activityItems: ActivityItem[] = detections
      .slice(0, 50)
      .map((detection) => {
        const device = detection.devices?.[0]
        return {
          mac: device?.mac || 'Unknown',
          location: detection.location || 'Unknown',
          timestamp: detection.created_at,
          distance: device?.distance_m || 0,
          rssi: device?.rssi || 0,
        }
      })

    return { stats, previousStats, activity: activityItems }
  }

  function handleNewDetection(detection: Detection) {
    // Update stats in real-time
    if (selectedLocation === 'all' || detection.location === selectedLocation) {
      fetchData()
    }
  }

  function handleExportCSV() {
    exportToCSV(activity, `detections-${dateRange}-${selectedLocation}`)
  }

  function handleExportPDF() {
    exportToPDF()
  }

  function handleCopyShareLink() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link copiado al portapapeles')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-end">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* KPI Strip */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              title="Visitantes Hoy"
              value={stats.uniqueToday}
              change={stats.changeVsYesterday.visitors}
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              title="Visitantes Recurrentes"
              value={`${stats.returningVisitorsPercent.toFixed(1)}%`}
              change={stats.changeVsYesterday.engagement}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KpiCard
              title="Tiempo Promedio"
              value={`${Math.round(stats.avgDwellTime / 60)} min`}
              change={stats.changeVsYesterday.dwellTime}
              icon={<Clock className="h-5 w-5" />}
            />
            <KpiCard
              title="Hora Pico"
              value={`${stats.peakHour}:00`}
              subtitle={`${stats.peakHourCount} visitantes`}
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Main Content Sections */}
        {viewMode !== 'raw' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Traffic Section */}
            <SectionCard title="Tráfico" className="lg:col-span-2">
              <TrafficTimeline selectedLocation={selectedLocation} dateRange={dateRange} loading={loading} />
            </SectionCard>

            {/* Engagement Section */}
            <SectionCard title="Engagement">
              <EngagementCharts selectedLocation={selectedLocation} dateRange={dateRange} loading={loading} />
            </SectionCard>
          </div>
        )}

        {/* Audience Section */}
        {viewMode !== 'raw' && (
          <SectionCard title="Audiencia" className="mb-8">
            <AudienceSegments selectedLocation={selectedLocation} dateRange={dateRange} loading={loading} />
          </SectionCard>
        )}

        {/* Insights Panel */}
        {viewMode === 'executive' && insights.length > 0 && (
          <SectionCard title="Insights & Acciones" className="mb-8">
            <InsightsPanel insights={insights} />
          </SectionCard>
        )}

        {/* Export Bar */}
        <div className="mb-8">
          <ExportBar
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onCopyShareLink={handleCopyShareLink}
          />
        </div>

        {/* Activity Table */}
        <SectionCard title="Actividad Reciente">
          <ActivityTable items={activity} loading={loading} />
        </SectionCard>

        {/* Advanced Charts (Analyst View) */}
        {viewMode === 'analyst' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SectionCard title="Distribución por Hora">
              <PeakHourChart 
                peakHour={stats?.peakHour || 0}
                peakHourCount={stats?.peakHourCount || 0}
                selectedLocation={selectedLocation} 
                dateRange={dateRange} 
              />
            </SectionCard>
            <SectionCard title="Heatmap">
              <HeatmapChart selectedLocation={selectedLocation} dateRange={dateRange} />
            </SectionCard>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

