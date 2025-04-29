import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch all bookings
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select('*');

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