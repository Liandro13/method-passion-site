// Centralized booking action hooks

import { useState, useCallback } from 'react';
import { updateBooking, deleteBooking } from '../lib/api';
import type { Booking } from '../types';

interface UseBookingActionsOptions {
  onSuccess?: () => void;
}

export function useBookingActions(options: UseBookingActionsOptions = {}) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { onSuccess } = options;

  const handleQuickApprove = useCallback(async (booking: Booking) => {
    if (!confirm(`Confirmar a reserva de ${booking.primary_name}?`)) return;
    
    setUpdatingId(booking.id);
    try {
      await updateBooking(booking.id, { status: 'confirmed' });
      onSuccess?.();
    } catch (error) {
      console.error('Error approving booking:', error);
    } finally {
      setUpdatingId(null);
    }
  }, [onSuccess]);

  const handleQuickReject = useCallback(async (booking: Booking) => {
    if (!confirm('Tem certeza que deseja rejeitar esta reserva?')) return;
    
    setUpdatingId(booking.id);
    try {
      await updateBooking(booking.id, { status: 'cancelled' });
      onSuccess?.();
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setUpdatingId(null);
    }
  }, [onSuccess]);

  const handleDelete = useCallback(async (booking: Booking) => {
    if (!confirm('Tem certeza que deseja eliminar esta reserva permanentemente?')) return;
    
    setUpdatingId(booking.id);
    try {
      await deleteBooking(booking.id);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting booking:', error);
    } finally {
      setUpdatingId(null);
    }
  }, [onSuccess]);

  return {
    updatingId,
    isUpdating: (id: number) => updatingId === id,
    handleQuickApprove,
    handleQuickReject,
    handleDelete
  };
}
