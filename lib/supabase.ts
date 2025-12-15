import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zproheefniynfxbsvuku.supabase.co'
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      detections: {
        Row: {
          id: number
          sensor_id: string
          location: string
          wifi_rssi: number
          devices: Array<{
            mac: string
            fp: string
            rssi: number
            peak_rssi: number
            duration: number
            packets: number
            distance_m: number
          }>
          created_at: string
        }
        Insert: {
          id?: number
          sensor_id: string
          location: string
          wifi_rssi: number
          devices: Array<{
            mac: string
            fp: string
            rssi: number
            peak_rssi: number
            duration: number
            packets: number
            distance_m: number
          }>
          created_at?: string
        }
        Update: {
          id?: number
          sensor_id?: string
          location?: string
          wifi_rssi?: number
          devices?: Array<{
            mac: string
            fp: string
            rssi: number
            peak_rssi: number
            duration: number
            packets: number
            distance_m: number
          }>
          created_at?: string
        }
      }
    }
  }
}

