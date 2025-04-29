import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Ensure these environment variables are set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic check for environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase URL or Key is not defined in environment variables.");
  // Optionally, throw an error or handle this case appropriately
  // For now, we proceed, but Supabase client creation will likely fail
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch all bookings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*');

    if (error) {
      console.error('Supabase GET Error:', error);
      throw error; // Throw error to be caught by the catch block
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET Handler Error:', error);
    // Return a generic error message to the client
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error.message }, { status: 500 });
  }
}

// POST - Create a new booking
export async function POST(request) {
  try {
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
      .select() // Return the created record
      .single(); // Expecting a single record back

    if (error) {
      console.error('Supabase POST Error:', error);
      throw error;
    }

    // Supabase returns an array, but insert().select().single() should give one object
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST Handler Error:', error);
    return NextResponse.json({ error: 'Failed to create booking', details: error.message }, { status: 500 });
  }
}

// PUT - Update a booking
export async function PUT(request) {
  try {
    const body = await request.json();
    // Renamed 'id' from the frontend to match the expected 'bookingId' for update
    const { id, newDate, newTime, newService } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Build the update object only with provided fields
    const updates = {};
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

    const { data, error, count } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id) // Ensure 'id' is the correct column name in your Supabase table
      .select()
      .single();

    if (error) {
      console.error('Supabase PUT Error:', error);
      throw error;
    }

    // Check if any row was actually updated
    if (count === 0 || !data) {
        return NextResponse.json(
            { error: 'Booking not found or no changes made' },
            { status: 404 } // Or 400 depending on desired behavior
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT Handler Error:', error);
    // Handle potential errors like unique constraint violations, etc.
    return NextResponse.json({ error: 'Failed to update booking', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete a booking
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { bookingId } = body; // Matching the frontend request body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId); // Ensure 'id' is the correct column name

    if (error) {
      console.error('Supabase DELETE Error:', error);
      throw error;
    }

    // Check if a row was actually deleted
    if (count === 0) {
        return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('DELETE Handler Error:', error);
    return NextResponse.json({ error: 'Failed to delete booking', details: error.message }, { status: 500 });
  }
} 