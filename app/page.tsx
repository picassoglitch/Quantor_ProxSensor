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

export default function Dashboard({ clientId }: DashboardProps = {}) {
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
  }, [clientId])

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
  }, [selectedLocation])

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
      // Check if admin is viewing (via query param)
      const urlParams = new URLSearchParams(window.location.search)
      const isAdminView = urlParams.get('admin') === 'true'
      
      let query = supabase
        .from('detections')
        .select('location')
        .order('created_at', { ascending: false })
        .limit(1000)

      // Filter by client_id if provided (RLS will handle the rest)
      // The RLS policy will automatically filter by client_id or store assignments
      // So we don't need to manually filter here - RLS does it for us

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
      const now = new Date()
      const startDate = getStartDate(dateRange, now)
      const previousStartDate = getPreviousPeriodStart(dateRange, now)

      // Check if admin is viewing (via query param)
      const urlParams = new URLSearchParams(window.location.search)
      const isAdminView = urlParams.get('admin') === 'true'
      
      // Fetch current period
      let query = supabase
        .from('detections')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Filter by client stores if clientId is provided (and not admin view)
      if (clientId && clientStores.length > 0 && !isAdminView) {
        query = query.in('location', clientStores)
      }

      if (selectedLocation !== 'all') {
        query = query.eq('location', selectedLocation)
      }

      const { data, error } = await query
      if (error) throw error

      const detections = (data || []) as Detection[]
      const stats = calculateMarketingStats(detections, selectedLocation, now)
      setStats(stats)

      // Fetch previous period for comparison
      let prevQuery = supabase
        .from('detections')
        .select('*')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (selectedLocation !== 'all') {
        prevQuery = prevQuery.eq('location', selectedLocation)
      }

      const { data: prevData } = await prevQuery
      if (prevData) {
        const prevDetections = prevData as Detection[]
        const prevStats = calculateMarketingStats(prevDetections, selectedLocation, now)
        setPreviousStats(prevStats)
        
        // Calculate changes
        stats.changeVsYesterday = {
          visitors: prevStats.uniqueToday > 0 
            ? ((stats.uniqueToday - prevStats.uniqueToday) / prevStats.uniqueToday) * 100 
            : 0,
          dwellTime: prevStats.avgDwellTime > 0
            ? ((stats.avgDwellTime - prevStats.avgDwellTime) / prevStats.avgDwellTime) * 100
            : 0,
          engagement: prevStats.engagementScore > 0
            ? ((stats.engagementScore - prevStats.engagementScore) / prevStats.engagementScore) * 100
            : 0,
        }
      }

      // Build activity feed
      const activityItems: ActivityItem[] = []
      detections.slice(0, 100).forEach(detection => {
        detection.devices.forEach(device => {
          activityItems.push({
            mac: device.mac,
            location: detection.location,
            timestamp: detection.created_at,
            distance: device.distance_m,
            rssi: device.rssi,
          })
        })
      })
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setActivity(activityItems.slice(0, 50))

      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  function handleNewDetection(detection: Detection) {
    if (selectedLocation !== 'all' && detection.location !== selectedLocation) {
      return
    }
    fetchData()
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

  function getPreviousPeriodStart(range: string, now: Date): Date {
    const startDate = getStartDate(range, now)
    const periodLength = now.getTime() - startDate.getTime()
    return new Date(startDate.getTime() - periodLength)
  }

  function calculateMarketingStats(detections: Detection[], location: string, now: Date): MarketingStats {
    const locationDetections = location === 'all' 
      ? detections 
      : detections.filter(d => d.location === location)

    // Live count (devices seen in last 30 seconds)
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)
    const recentDetections = locationDetections.filter(
      d => new Date(d.created_at) >= thirtySecondsAgo
    )
    const liveDevices = new Set<string>()
    recentDetections.forEach(d => {
      d.devices.forEach(dev => liveDevices.add(dev.mac))
    })

    // Unique visitors
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const uniqueToday = new Set<string>()
    const uniqueThisWeek = new Set<string>()
    const uniqueThisMonth = new Set<string>()
    const allVisitors = new Set<string>()

    locationDetections.forEach(d => {
      const date = new Date(d.created_at)
      d.devices.forEach(dev => {
        allVisitors.add(dev.mac)
        if (date >= todayStart) uniqueToday.add(dev.mac)
        if (date >= weekStart) uniqueThisWeek.add(dev.mac)
        if (date >= monthStart) uniqueThisMonth.add(dev.mac)
      })
    })

    // New vs Returning (simplified: compare today with previous days)
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const previousVisitors = new Set<string>()
    locationDetections.forEach(d => {
      const date = new Date(d.created_at)
      if (date >= previousWeekStart && date < weekStart) {
        d.devices.forEach(dev => previousVisitors.add(dev.mac))
      }
    })

    const newVisitors = Array.from(uniqueToday).filter(mac => !previousVisitors.has(mac)).length
    const returningVisitors = Array.from(uniqueToday).filter(mac => previousVisitors.has(mac)).length
    const returningVisitorsPercent = uniqueToday.size > 0 
      ? (returningVisitors / uniqueToday.size) * 100 
      : 0

    // Average dwell time
    const deviceDurations = new Map<string, number[]>()
    locationDetections.forEach(d => {
      d.devices.forEach(dev => {
        if (!deviceDurations.has(dev.mac)) {
          deviceDurations.set(dev.mac, [])
        }
        deviceDurations.get(dev.mac)!.push(dev.duration)
      })
    })

    let totalDwellTime = 0
    let deviceCount = 0
    deviceDurations.forEach((durations, mac) => {
      const maxDuration = Math.max(...durations)
      totalDwellTime += maxDuration
      deviceCount++
    })
    const avgDwellTime = deviceCount > 0 ? totalDwellTime / deviceCount / 60 : 0 // in minutes

    // Peak hour
    const hourlyCounts = new Map<number, number>()
    locationDetections.forEach(d => {
      const hour = new Date(d.created_at).getHours()
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + d.devices.length)
    })

    let peakHour = 0
    let peakHourCount = 0
    hourlyCounts.forEach((count, hour) => {
      if (count > peakHourCount) {
        peakHourCount = count
        peakHour = hour
      }
    })

    // Device types (simplified)
    const deviceTypes: Record<string, number> = {}
    locationDetections.forEach(d => {
      d.devices.forEach(dev => {
        deviceTypes['Móvil'] = (deviceTypes['Móvil'] || 0) + 1
      })
    })

    const baseStats: MarketingStats = {
      location: location === 'all' ? 'Todas las Ubicaciones' : location,
      liveCount: liveDevices.size,
      uniqueToday: uniqueToday.size,
      uniqueThisWeek: uniqueThisWeek.size,
      uniqueThisMonth: uniqueThisMonth.size,
      avgDwellTime,
      peakHour,
      peakHourCount,
      returningVisitorsPercent,
      engagementScore: 0, // Will be calculated
      changeVsYesterday: {
        visitors: 0,
        dwellTime: 0,
        engagement: 0,
      },
      newVisitors,
      returningVisitors,
      deviceTypes,
    }

    baseStats.engagementScore = calculateEngagementScore(baseStats)

    return baseStats
  }

  const handleExportCSV = () => {
    exportToCSV(activity, `actividad-${selectedLocation}`)
  }

  const handleExportPDF = () => {
    exportToPDF()
  }

  const handleExportSlide = (insightId: string) => {
    // Placeholder - could generate a slide export
    console.log('Export slide for insight:', insightId)
  }

  const handleComparePeriod = (insightId: string) => {
    // Placeholder - could show comparison view
    console.log('Compare period for insight:', insightId)
  }

  const handleViewSegment = (insightId: string) => {
    // Placeholder - could filter to show segment
    console.log('View segment for insight:', insightId)
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
        {/* View Mode Toggle and Export Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <ExportBar
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <KpiCard
                title="Visitantes Hoy"
                value={stats?.uniqueToday || 0}
                icon={<Users className="h-5 w-5" />}
                change={stats?.changeVsYesterday.visitors}
                changeLabel="vs ayer"
                loading={loading}
              />
              <KpiCard
                title="Visitantes Recurrentes"
                value={stats ? `${stats.returningVisitorsPercent.toFixed(1)}%` : '0%'}
                icon={<Target className="h-5 w-5" />}
                subtitle={`${stats?.returningVisitors || 0} de ${stats?.uniqueToday || 0}`}
                loading={loading}
              />
              <KpiCard
                title="Tiempo Promedio"
                value={stats?.avgDwellTime ? `${stats.avgDwellTime.toFixed(1)} min` : '0 min'}
                icon={<Clock className="h-5 w-5" />}
                change={stats?.changeVsYesterday.dwellTime}
                changeLabel="vs ayer"
                loading={loading}
              />
              <KpiCard
                title="Hora Pico"
                value={stats?.peakHour !== undefined ? `${stats.peakHour}:00` : 'N/A'}
                icon={<Calendar className="h-5 w-5" />}
                subtitle={`${stats?.peakHourCount || 0} visitantes`}
                loading={loading}
              />
              <KpiCard
                title="Puntuación de Compromiso"
                value={stats?.engagementScore || 0}
                icon={<TrendingUp className="h-5 w-5" />}
                subtitle="de 100"
                change={stats?.changeVsYesterday.engagement}
                changeLabel="vs ayer"
                loading={loading}
              />
              <KpiCard
                title="Tráfico de Pie"
                value={activity.length}
                icon={<BarChart3 className="h-5 w-5" />}
                subtitle="detecciones recientes"
                loading={loading}
              />
            </div>

            {/* Main Content Sections */}
            {viewMode !== 'raw' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Traffic Section */}
                <SectionCard
                  title="Tráfico"
                  subtitle="Línea de tiempo y resumen de hora pico"
                  icon={<TrendingUp className="h-5 w-5" />}
                  loading={loading}
                >
                  <TrafficTimeline
                    selectedLocation={selectedLocation}
                    dateRange={dateRange}
                    loading={loading}
                  />
                </SectionCard>

                {/* Engagement Section */}
                <SectionCard
                  title="Compromiso"
                  subtitle="Distribución de tiempo de permanencia"
                  icon={<Clock className="h-5 w-5" />}
                  loading={loading}
                >
                  <EngagementCharts
                    selectedLocation={selectedLocation}
                    dateRange={dateRange}
                    loading={loading}
                  />
                </SectionCard>

                {/* Audience Section */}
                <SectionCard
                  title="Audiencia"
                  subtitle="Nuevos vs recurrentes y tipos de dispositivos"
                  icon={<Users className="h-5 w-5" />}
                  loading={loading}
                >
                  <AudienceSegments
                    selectedLocation={selectedLocation}
                    dateRange={dateRange}
                    loading={loading}
                  />
                </SectionCard>
              </div>
            )}

            {/* Analyst View - Additional Charts */}
            {viewMode === 'analyst' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <PeakHourChart
                  peakHour={stats?.peakHour || 0}
                  peakHourCount={stats?.peakHourCount || 0}
                  selectedLocation={selectedLocation}
                  dateRange={dateRange}
                />
                <HeatmapChart
                  selectedLocation={selectedLocation}
                  dateRange={dateRange}
                />
              </div>
            )}

            {/* Insights Panel */}
            {viewMode !== 'raw' && (
              <div className="mb-8">
                <InsightsPanel
                  insights={insights}
                  onExportSlide={handleExportSlide}
                  onComparePeriod={handleComparePeriod}
                  onViewSegment={handleViewSegment}
                />
              </div>
            )}

            {/* Activity Table */}
            <ActivityTable items={activity} loading={loading} />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
