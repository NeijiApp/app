import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Protected route configuration
 */
const PROTECTED_ROUTES = [
  '/protected',
  '/admin',
  '/api/meditation',
  '/api/chat/history',
  '/api/user',
];

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/api/auth',
];

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  '/api/meditation': { requests: 10, windowMs: 60000 }, // 10 requests per minute
  '/api/chat': { requests: 30, windowMs: 60000 }, // 30 requests per minute
  default: { requests: 100, windowMs: 60000 }, // 100 requests per minute
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check rate limits
 */
function checkRateLimit(pathname: string, clientId: string): boolean {
  const limits = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const key = `${clientId}:${pathname}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limits.windowMs,
    });
    return true;
  }
  
  if (record.count >= limits.requests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Enhanced authentication middleware
 */
export async function authMiddleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get pathname
  const pathname = request.nextUrl.pathname;

  // Check rate limiting
  const clientId = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  if (!checkRateLimit(pathname, clientId)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Check if route is protected
  if (isProtectedRoute(pathname)) {
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      // Redirect to login for web routes, return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Add user context to headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
    }
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}
