   // lib/types/barber.ts
   export interface Barber {
    id: string;
    name: string;
    email?: string;
    // Add other barber properties
  }

  export interface BarberProfile {
    id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    name?: string;
    location?: string;
    services?: any; // Consider typing this better based on your service structure
    created_at: string;
    updated_at: string;
  }