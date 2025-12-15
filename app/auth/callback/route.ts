import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    // OAuth callback
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }

  if (token && type === 'recovery') {
    // Password reset callback
    return NextResponse.redirect(
      new URL(`/auth/reset-password?token=${token}&type=${type}`, requestUrl.origin)
    )
  }

  // Default redirect
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}

