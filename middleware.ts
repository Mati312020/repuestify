// NOTE: Next.js 16 deprecates middleware.ts in favor of proxy.ts.
// We keep middleware.ts for now because @supabase/ssr requires NextRequest/NextResponse
// which is not available in the new proxy.ts Web Fetch API.
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ADMIN_PATHS = ['/admin']
const ADMIN_LOGIN = '/admin/login'

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p))
}

function getOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host
  return `${proto}://${host}`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth when Supabase is not configured (local dev without .env.local)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (!isAdminPath(pathname)) return supabaseResponse

  const origin = getOrigin(request)

  if (!user && pathname !== ADMIN_LOGIN) {
    const loginUrl = new URL(ADMIN_LOGIN, origin)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
