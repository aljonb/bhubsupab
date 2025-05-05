"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import styles from '../styles/Bookings.module.css';
import { Booking } from '@/lib/types';

type UseLocalStorageReturnType<T> = [T, (value: T | ((val: T) => T)) => void];

export default function Bookings() {
  const useLocalStorage = <T,>(key: string, initialValue: T): UseLocalStorageReturnType<T> => {
    const [storedValue, setStoredValue] = useState<T>(() => {
      if (typeof window === "undefined") return initialValue;
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });

    const setValue = (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    return [storedValue, setValue];
  };

  const [isClient, setIsClient] = useState<boolean>(false);
  const [bookings, setBookings] = useLocalStorage<Booking[]>('bookings', []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create booking state
  const [userId, setUserId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [service, setService] = useState<string>('');
  
  // Update booking state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [newService, setNewService] = useState<string>('');
  
  // Delete booking state
  const [bookingIdToDelete, setBookingIdToDelete] = useState<string>('');

  // Set isClient to true once the component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchBookings();
    }
  }, [isClient]);

  const fetchBookings = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!userId || !date || !time || !service) {
        throw new Error('All fields are required');
      }
      
      const newBooking = { userId, date, time, service };
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create booking');
      
      // Reset form and refresh bookings
      setUserId('');
      setDate('');
      setTime('');
      setService('');
      fetchBookings();
      alert('Booking created successfully!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBookingForUpdate = (booking: Booking): void => {
    setSelectedBooking(booking);
    setNewDate(booking.date);
    setNewTime(booking.time);
    setNewService(booking.service);
  };

  const handleUpdateBooking = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedBooking = {
        id: selectedBooking.id,
        newDate,
        newTime,
        newService,
      };
      
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBooking),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update booking');
      
      // Reset form and refresh bookings
      setSelectedBooking(null);
      setNewDate('');
      setNewTime('');
      setNewService('');
      fetchBookings();
      alert('Booking updated successfully!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete booking');
      
      fetchBookings();
      alert('Booking deleted successfully!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // The rest of the component remains the same, with proper type annotations for event handlers
  return (
    <div className={styles.container}>
      <h1>Bookings Management</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {/* Display List of Bookings */}
      <section className={styles.section}>
        <h2>Bookings List</h2>
        {!isClient ? (
          <p>Loading...</p>
        ) : loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Service</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.user_id}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>{booking.service}</td>
                  <td>
                    <button 
                      onClick={() => handleSelectBookingForUpdate(booking)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteBooking(booking.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Form to Create Booking */}
      <section className={styles.section}>
        <h2>Create Booking</h2>
        <form onSubmit={handleCreateBooking} className={styles.form}>
          <div className={styles.formGroup}>
            <label>User ID:</label>
            <input
              type="number"
              value={userId}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
              required
            />
          </div>
          {/* Additional form fields would continue here with proper TypeScript types */}
        </form>
      </section>
    </div>
  );
} 