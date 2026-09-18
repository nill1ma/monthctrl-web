import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  console.log('[middleware]', req.method, req.nextUrl.pathname, '→ user:', user?.id ?? 'NENHUM', '| cookies:', req.cookies.getAll().map(c => c.name))

  if (!user && (req.nextUrl.pathname.startsWith('/list') || req.nextUrl.pathname.startsWith('/create'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return response
}

export const config = { matcher: ['/list/:path*', '/create/:path*', '/login'] }