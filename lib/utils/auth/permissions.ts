import { SupabaseClient, User, AuthError } from '@supabase/supabase-js';
// Remove NextRequest, NextResponse imports if no longer needed here
// import { NextRequest, NextResponse } from 'next/server';
// Keep createClient import ONLY if hasPermission/hasRole need it independently
// import { createClient } from '@/utils/supabase/server';

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