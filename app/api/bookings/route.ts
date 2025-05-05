import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { SupabaseClient, User, AuthError } from '@supabase/supabase-js';

// Add these interfaces
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
async function hasPermission(supabase: SupabaseClient, userId: string, permissionName: string) {
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
  
  console.log('Permission data structure:', JSON.stringify(data, null, 2));
  
  // Fix access pattern based on actual structure from console log
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

// GET - Fetch all bookings
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to view all bookings
    const canViewAll = await hasPermission(supabase, user.id, 'booking:read_all');
    
    let query = supabase.from('bookings').select('*');
    
    // If user can't view all bookings, restrict to their own
    if (!canViewAll) {
      const canViewOwn = await hasPermission(supabase, user.id, 'booking:read');
      if (!canViewOwn) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase GET Error:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET Handler Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch bookings', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST - Create a new booking
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { userId, date, time, service } = body;

    if (!userId || !date || !time || !service) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, date, time, service }])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST Error:', error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST Handler Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create booking', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PUT - Update a booking
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, newDate, newTime, newService } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Build the update object only with provided fields
    const updates: Record<string, any> = {};
    if (newDate) updates.date = newDate;
    if (newTime) updates.time = newTime;
    if (newService) updates.service = newService;

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
        return NextResponse.json(
            { error: 'No update fields provided' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase PUT Error:', error);
      throw error;
    }

    if (!data) {
        return NextResponse.json(
            { error: 'Booking not found or no changes made' },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT Handler Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update booking', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE - Delete a booking
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error('Supabase DELETE Error:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('DELETE Handler Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete booking', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function hasRole(supabase: SupabaseClient, user: { data: { user: User | null }; error: AuthError | null }, roleName: string) {
  if (!user || user.error || !user.data.user) return false;
  
  const { data } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', user.data.user.id)
    .eq('roles.name', roleName);
    
  return data && data.length > 0;
}

export const updateSession = async (request: NextRequest) => {
  const supabase = await createClient(); // Define supabase client
  
  // Get current user - store the full response
  const userResponse = await supabase.auth.getUser();

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const isAdmin = await hasRole(supabase, userResponse, 'admin'); // Pass the full response
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  
  // Protect booking management routes for staff/admin only
  if (request.nextUrl.pathname.startsWith("/bookings/manage")) {
    // Need to check both roles using the full response object
    const isStaff = await hasRole(supabase, userResponse, 'staff');
    const isAdmin = await hasRole(supabase, userResponse, 'admin'); 
      
    if (!isStaff && !isAdmin) { // Check if neither staff nor admin
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  
  // Need to return a response, likely from the original middleware logic
  // Ensure you integrate this with the original middleware logic correctly
  // Example: return NextResponse.next(); // Placeholder for the actual middleware response
  
  // The original middleware logic should likely be integrated here.
  // The provided snippet only adds the role checks.
  // You need to make sure the original session update/response handling is present.
  // Since the original logic is missing, adding a placeholder return
  return NextResponse.next({ request }); // Adjust based on your middleware needs
} 