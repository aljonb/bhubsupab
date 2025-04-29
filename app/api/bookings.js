import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*');
        
        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    
    case 'POST':
      try {
        const { userId, date, time, service } = req.body;
        
        if (!userId || !date || !time || !service) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const { data, error } = await supabase
          .from('bookings')
          .insert([{ user_id: userId, date, time, service }])
          .select();
        
        if (error) throw error;
        return res.status(201).json(data[0]);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    
    case 'PUT':
      try {
        const { id, newDate, newTime, newService } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Booking ID is required' });
        }
        
        const updates = {};
        if (newDate) updates.date = newDate;
        if (newTime) updates.time = newTime;
        if (newService) updates.service = newService;
        
        const { data, error } = await supabase
          .from('bookings')
          .update(updates)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return res.status(200).json(data[0]);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    
    case 'DELETE':
      try {
        const { bookingId } = req.body;
        
        if (!bookingId) {
          return res.status(400).json({ error: 'Booking ID is required' });
        }
        
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        
        if (error) throw error;
        return res.status(200).json({ message: 'Booking deleted successfully' });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
} 