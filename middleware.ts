import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parse } from 'cookie'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient(req, res)
  
  // Check user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If accessing barber routes
  if (req.nextUrl.pathname.startsWith('/barber')) {
    // No session, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    // Check if user is a barber
    if (session.user.user_metadata?.role !== 'barber') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // Check barber approval status
    const { data: barberProfile } = await supabase
      .from('barber_profiles')
      .select('status')
      .eq('user_id', session.user.id)
      .single();
      
    if (!barberProfile || barberProfile.status !== 'approved') {
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }
  }
  
  return res;
}

function createClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const parsedCookies = parse(req.headers.get('cookie') || '')
          return Object.entries(parsedCookies)
            .filter(([_, value]) => value !== undefined)
            .map(([name, value]) => ({
              name,
              value: value || '',
            }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

export const config = {
  matcher: ['/barber/:path*', '/admin/:path*'],
};
