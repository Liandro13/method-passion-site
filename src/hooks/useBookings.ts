// Centralized hook for fetching bookings and blocked dates

import { useState, useEffect, useCallback } from 'react';
import { getBookings, getBlockedDates } from '../lib/api';
import type { Booking, BlockedDate } from '../types';

interface UseBookingsOptions {
  accommodationId?: number;
  autoLoad?: boolean;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { accommodationId, autoLoad = true } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, blockedRes] = await Promise.all([
        getBookings(accommodationId),
        getBlockedDates(accommodationId)
      ]);

      if (bookingsRes.bookings) setBookings(bookingsRes.bookings);
      if (blockedRes.blockedDates) setBlockedDates(blockedRes.blockedDates);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [accommodationId]);

  useEffect(() => {
    if (autoLoad) load();
  }, [load, autoLoad]);

  return {
    bookings,
    blockedDates,
    loading,
    reload: load
  };
}
