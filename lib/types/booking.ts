   // lib/types/booking.ts
   export interface Booking {
    id: string;
    userId: string;
    serviceId: string;
    barberId: string;
    startTime: Date;
    endTime: Date;
    // Add other booking properties
  }

     // lib/types/service.ts
   export interface Service {
     id: string;
     name: string;
     description?: string;
     price: number;
     durationMinutes: number;
     // Add other service properties
   }