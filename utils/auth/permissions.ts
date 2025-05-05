import { SupabaseClient, User, AuthError } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Define interfaces for type safety
interface Permission {
  name: string;
}

interface RolePermission {
  permissions: Permission[];
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
  
  // More specific typing for the query result
  type PermissionQueryResult = {
    role_id: number;
    roles: {
      role_permissions: {
        permissions: {
          name: string;
        }[];
      }[];
    };
  }[];
  
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
    
  if (error || !data) {
    console.error("Permission check error:", error);
    return false;
  }
  
  // Flatten the permission check logic
  for (const userRole of data) {
    if (!userRole.roles) continue;
    
    // Find any matching permission across all roles and permissions
    const hasMatchingPermission = userRole.roles.some(role => {
      if (!role.role_permissions) return false;
      
      return role.role_permissions.some(rolePermission => {
        if (!rolePermission.permissions || !Array.isArray(rolePermission.permissions)) return false;
        
        return rolePermission.permissions.some(permission => 
          permission && permission.name === permissionName
        );
      });
    });
    
    if (hasMatchingPermission) return true;
  }
  
  return false;
}

// Helper function to check if user has a specific role
export async function hasRole(supabase: SupabaseClient, userResponse: { data: { user: User | null }; error: AuthError | null }, roleName: string) {
  if (!userResponse || userResponse.error || !userResponse.data.user) return false;
  
  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', userResponse.data.user.id)
    .eq('roles.name', roleName);
    
  return data && data.length > 0;
}

// Define route protection configuration
interface RouteConfig {
  pattern: string | RegExp;
  type: 'exact' | 'startsWith';
  protection: 'authenticated' | 'unauthenticated' | 'role';
  roles?: string[];
  redirectTo: string;
}

// Route protection configuration
const routeProtection: RouteConfig[] = [
  {
    pattern: '/protected',
    type: 'startsWith',
    protection: 'authenticated',
    redirectTo: '/sign-in'
  },
  {
    pattern: '/',
    type: 'exact',
    protection: 'unauthenticated',
    redirectTo: '/protected'
  },
  {
    pattern: '/admin',
    type: 'startsWith',
    protection: 'role',
    roles: ['admin'],
    redirectTo: '/unauthorized'
  },
  {
    pattern: '/bookings/manage',
    type: 'startsWith',
    protection: 'role',
    roles: ['admin', 'staff'],
    redirectTo: '/unauthorized'
  }
];

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
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;

    // Check each route configuration
    for (const route of routeProtection) {
      const isMatch = route.type === 'exact' 
        ? request.nextUrl.pathname === route.pattern
        : request.nextUrl.pathname.startsWith(route.pattern as string);
      
      if (!isMatch) continue;

      // Handle authentication checks
      if (route.protection === 'authenticated' && (!user || userResponse.error)) {
        return NextResponse.redirect(new URL(route.redirectTo, request.url));
      }
      
      if (route.protection === 'unauthenticated' && user && !userResponse.error) {
        return NextResponse.redirect(new URL(route.redirectTo, request.url));
      }
      
      // Handle role-based protection
      if (route.protection === 'role' && route.roles && route.roles.length > 0 && user) {
        // Fetch all user roles once
        const { data } = await supabase
          .from('user_roles')
          .select('roles!inner(name)')
          .eq('user_id', user.id);
        
        const userRoles = data?.map(item => item.roles[0]?.name).filter(Boolean) || [];
        const hasRequiredRole = route.roles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          return NextResponse.redirect(new URL(route.redirectTo, request.url));
        }
      }
    }

    return response;
  } catch (e) {
    console.error("Session update error:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};