import { createBrowserClient } from '@supabase/ssr'
import { Database } from './supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zproheefniynfxbsvuku.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_'
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL or Anon Key is missing!', {
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseAnonKey ? 'present' : 'missing'
    })
    throw new Error('Supabase configuration is missing')
  }
  
  // Log configuration (without exposing full key)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase Client initialized:', {
      url: supabaseUrl,
      keyLength: supabaseAnonKey.length,
      keyPrefix: supabaseAnonKey.substring(0, 15) + '...',
      keyFormat: supabaseAnonKey.startsWith('sb_publishable_') ? 'Publishable Key (correct)' : 'Standard Key'
    })
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

