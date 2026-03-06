import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import type { Booking, BlockedDate } from '@method-passion/shared';

const API_BASE = '/api';

async function fetchWithAuth(url: string, token: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

interface UseBookingsOptions {
  accommodationId?: number;
}

interface UseBookingsResult {
  bookings: Booking[];
  blockedDates: BlockedDate[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useBookings(options: UseBookingsOptions = {}): UseBookingsResult {
  const { accommodationId } = options;
  const { getToken, isSignedIn } = useClerkAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      // Build URL with optional accommodation filter
      let bookingsUrl = '/bookings';
      if (accommodationId) {
        bookingsUrl += `?accommodation_id=${accommodationId}`;
      }

      const [bookingsResult, blockedResult] = await Promise.all([
        fetchWithAuth(bookingsUrl, token),
        accommodationId 
          ? fetchWithAuth(`/blocked-dates?accommodation_id=${accommodationId}`, token)
          : Promise.resolve({ blockedDates: [] })
      ]);

      setBookings(bookingsResult.bookings || []);
      setBlockedDates(blockedResult.blockedDates || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load bookings'));
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, accommodationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { bookings, blockedDates, loading, error, reload: loadData };
}

// Simple API function for stats
export async function getBookings(getToken: () => Promise<string | null>): Promise<{ bookings: Booking[] }> {
  const token = await getToken();
  return fetchWithAuth('/bookings', token);
}
