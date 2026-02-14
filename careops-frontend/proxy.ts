import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Next.js Proxy for Server-Side Authentication
 * 
 * Security Strategy:
 * 1. Server-side validation before page render (prevents FOUC)
 * 2. Token verification against backend API
 * 3. Redirect to login with return URL preservation
 * 4. Public routes whitelist
 * 
 * References:
 * - FastAPI JWT auth patterns
 * - Next.js proxy best practices (Next.js 16+)
 * - OWASP authentication guidelines
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/workspace',
    '/api',
    '/_next',
    '/favicon.ico'
  ]
  
  //Check if current route is public (exact match for root, or starts with for others)
  const isPublicRoute = pathname === '/' || publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Get token from cookie or Authorization header
  const token = request.cookies.get('authToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  // No token found, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  try {
    // Verify token with backend (server-side validation)
    const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Use cache: 'no-store' to avoid stale token validation
      cache: 'no-store'
    })
    
    if (!verifyResponse.ok) {
      // Token invalid or expired, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('reason', 'session_expired')
      
      const response = NextResponse.redirect(loginUrl)
      // Clear invalid token
      response.cookies.delete('authToken')
      return response
    }
    
    // Token valid, allow request to proceed
    return NextResponse.next()
    
  } catch (error) {
    console.error('Proxy auth verification failed:', error)
    
    // On network error, allow through (fail open for availability)
    // but client-side protection will still apply
    return NextResponse.next()
  }
}

// Next.js 16 proxy convention: no config export needed.
// The proxy function runs on all non-static requests automatically.
