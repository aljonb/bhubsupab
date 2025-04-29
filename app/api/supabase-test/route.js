import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Log the environment variables (be careful not to expose full keys in production)
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + "...");
    console.log("Supabase Key provided:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    const { data, error } = await supabase.from('bookings').select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      message: "Connected to Supabase successfully", 
      table: "bookings", 
      data 
    });
  } catch (error) {
    console.error("Supabase test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
} 