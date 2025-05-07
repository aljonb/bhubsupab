"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { Button } from "@/components/ui/button";

interface BarberProfile {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  name: string | null;
  location: string | null;
  created_at: string;
  email?: string;
}

export default function AdminBarberApproval() {
  const [barbers, setBarbers] = useState<BarberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPendingBarbers = async () => {
    setLoading(true);
    
    // Get barber profiles with pending status
    const { data: barberProfiles, error: profilesError } = await supabase
      .from('barber_profiles')
      .select('*')
      .eq('status', 'pending');
      
    if (profilesError) {
      setError("Failed to load barber profiles");
      setLoading(false);
      return;
    }
    
    // Get user emails for the barber profiles
    const barberIds = barberProfiles.map(profile => profile.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', barberIds);
      
    if (usersError) {
      setError("Failed to load user data");
      setLoading(false);
      return;
    }
    
    // Merge barber profiles with user emails
    const barberData = barberProfiles.map(profile => {
      const user = users?.find(u => u.id === profile.user_id);
      return {
        ...profile,
        email: user?.email
      };
    });
    
    setBarbers(barberData);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchPendingBarbers();
  }, []);
  
  const updateBarberStatus = async (barberId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('barber_profiles')
      .update({ status })
      .eq('id', barberId);
      
    if (error) {
      setError(`Failed to ${status} barber: ${error.message}`);
    } else {
      // Refresh the list after updating
      fetchPendingBarbers();
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Barber Approvals</h1>
      
      {barbers.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded-md">
          No pending barber applications
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Applied On</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {barbers.map((barber) => (
                <tr key={barber.id} className="border-t">
                  <td className="p-3">{barber.email || 'Unknown'}</td>
                  <td className="p-3">{barber.name || 'Not provided'}</td>
                  <td className="p-3">{barber.location || 'Not provided'}</td>
                  <td className="p-3">{new Date(barber.created_at).toLocaleDateString()}</td>
                  <td className="p-3 flex gap-2">
                    <Button 
                      onClick={() => updateBarberStatus(barber.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => updateBarberStatus(barber.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}