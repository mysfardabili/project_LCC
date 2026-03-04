import { auth } from '@/lib/auth-edge'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isSantriRoute = nextUrl.pathname.startsWith('/santri')
  const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register'

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    const role = session?.user?.role
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', nextUrl))
    }
    return NextResponse.redirect(new URL('/santri/catalog', nextUrl))
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && (isAdminRoute || isSantriRoute)) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Role-based protection
  if (isLoggedIn) {
    const role = session?.user?.role
    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/santri/catalog', nextUrl))
    }
    if (isSantriRoute && role !== 'SANTRI') {
      return NextResponse.redirect(new URL('/admin/dashboard', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
}
