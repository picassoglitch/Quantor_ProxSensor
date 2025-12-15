export interface Device {
  mac: string
  fp: string
  rssi: number
  peak_rssi: number
  duration: number
  packets: number
  distance_m: number
}

export interface Detection {
  id: number
  sensor_id: string
  location: string
  wifi_rssi: number
  devices: Device[]
  created_at: string
}

export interface LocationStats {
  location: string
  liveCount: number
  uniqueToday: number
  uniqueThisWeek: number
  uniqueThisMonth: number
  avgDwellTime: number
  peakHour: number
  peakHourCount: number
}

export interface HourlyData {
  hour: number
  count: number
  date: string
}

export interface ActivityItem {
  mac: string
  location: string
  timestamp: string
  distance: number
  rssi: number
}

export interface Insight {
  id: string
  type: 'traffic' | 'engagement' | 'timing'
  category: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'success'
}

export interface MarketingStats extends LocationStats {
  returningVisitorsPercent: number
  engagementScore: number
  changeVsYesterday: {
    visitors: number
    dwellTime: number
    engagement: number
  }
  newVisitors: number
  returningVisitors: number
  deviceTypes: Record<string, number>
}

export interface User {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'client'
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  name: string
  location: string
  sensor_id: string | null
  client_id: string | null
  created_at: string
  updated_at: string
}

export interface ClientStore {
  id: string
  client_id: string
  store_id: string
  created_at: string
}

export interface Sensor {
  sensor_id: string
  location: string
  store_name?: string
  store_id?: string
  client_id?: string | null
  status: 'online' | 'standby' | 'offline' | 'error' | 'unknown'
  last_seen: string | null
  last_seen_ago: number // seconds ago
  device_count: number
  total_detections: number
  error_count: number
  wifi_rssi: number | null
  uptime_percent: number
  avg_devices_per_hour: number
}

