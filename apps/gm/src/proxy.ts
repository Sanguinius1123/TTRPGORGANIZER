import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as object))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — only allow auth routes
  if (!user) {
    if (isAuthRoute) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in on auth route — redirect based on role
  if (isAuthRoute) {
    const { data: profile } = await supabase.from('profiles').select('is_gm').eq('id', user.id).single()
    if (profile?.is_gm) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.redirect(new URL('/play', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
