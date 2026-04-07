import { NextRequest, NextResponse } from 'next/server'

function getLoginRoute(pathname: string) {
  if (pathname.startsWith('/admin')) return '/admin/login'
  if (pathname.startsWith('/ops')) return '/ops/login'
  if (pathname.startsWith('/customer')) return '/customer/login'
  return '/console/login'
}

function roleMatchesPath(pathname: string, role: string) {
  if (pathname.startsWith('/admin')) return role === 'ADMIN'
  if (pathname.startsWith('/ops')) return role === 'OPS'
  if (pathname.startsWith('/customer') || pathname.startsWith('/console')) {
    return role === 'CUSTOMER_USER' || role === 'CUSTOMER_ADMIN'
  }
  return true
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname === '/console/login' ||
    pathname === '/customer/login' ||
    pathname === '/ops/login' ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next()
  }

  const hasSessionHint = request.cookies.get('zord_session_present')?.value === '1'
  if (!hasSessionHint) {
    return NextResponse.redirect(new URL(getLoginRoute(pathname), request.url))
  }

  const role = request.cookies.get('zord_role')?.value
  if (role && !roleMatchesPath(pathname, role)) {
    return NextResponse.redirect(new URL(getLoginRoute(pathname), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/console/:path*', '/customer/:path*', '/ops/:path*', '/admin/:path*'],
}
