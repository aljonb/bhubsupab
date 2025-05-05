import { SupabaseClient, User, AuthError } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Define interfaces for type safety
interface Permission {
  name: string;
}

interface RolePermission {
  permissions: Permission;
}

interface Role {
  role_permissions: RolePermission[];
}

interface UserRole {
  role_id: number;
  roles: {
    role_permissions: {
      permissions: {
        name: string;
      }[];
    }[];
  };
}

// Helper function to check if user has permission
export async function hasPermission(supabase: SupabaseClient, userId: string, permissionName: string) {
  if (!userId) return false;
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles!inner(
        role_permissions!inner(
          permissions!inner(name)
        )
      )
    `)
    .eq('user_id', userId);
    
  if (error || !data) return false;
  
  // Check permission in the data structure
  return data.some(role => {
    if (!role.roles) return false;
    return role.roles.some(r => 
      r.role_permissions?.some(rp => 
        rp.permissions && Array.isArray(rp.permissions) && 
        rp.permissions.some(p => p.name === permissionName)
      )
    );
  });
}

// Helper function to check if user has a specific role
export async function hasRole(supabase: SupabaseClient, user: { data: { user: User | null }; error: AuthError | null }, roleName: string) {
  if (!user || user.error || !user.data.user) return false;
  
  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.data.user.id)
    .eq('roles.name', roleName);
    
  return data && data.length > 0;
}

// Unified session update function
export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = await createClient();

    // This will refresh session if expired - required for Server Components
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;

    // Basic auth routes protection
    if (request.nextUrl.pathname.startsWith("/protected") && (!user || userResponse.error)) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (request.nextUrl.pathname === "/" && user && !userResponse.error) {
      return NextResponse.redirect(new URL("/protected", request.url));
    }

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const isAdmin = await hasRole(supabase, userResponse, 'admin');
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
    
    // Protect booking management routes for staff/admin only
    if (request.nextUrl.pathname.startsWith("/bookings/manage")) {
      const isStaff = await hasRole(supabase, userResponse, 'staff');
      const isAdmin = await hasRole(supabase, userResponse, 'admin'); 
        
      if (!isStaff && !isAdmin) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    return response;
  } catch (e) {
    console.error("Session update error:", e);
    // If error occurs, continue without blocking the request
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};