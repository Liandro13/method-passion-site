import { useState, useEffect, useCallback } from 'react';
import { getBookings, updateBooking } from '../lib/api';
import type { Booking } from '../types';

const ACCOMMODATIONS: Record<number, string> = {
  1: 'Esperança Terrace',
  2: 'Nattura Gerês Village',
  3: 'Douro & Sabor Escape'
};

export default function ApprovalsPanel() {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const loadPendingBookings = useCallback(async () => {
    try {
      const result = await getBookings(undefined, 'pending');
      if (result.bookings) {
        setPendingBookings(result.bookings);
      }
    } catch (error) {
      console.error('Error loading pending bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingBookings();
  }, [loadPendingBookings]);

  const handleApprove = async (booking: Booking) => {
    setUpdating(booking.id);
    try {
      await updateBooking(booking.id, { status: 'confirmed' });
      await loadPendingBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (booking: Booking) => {
    if (!confirm('Tem certeza que deseja rejeitar esta reserva?')) return;
    
    setUpdating(booking.id);
    try {
      await updateBooking(booking.id, { status: 'cancelled' });
      await loadPendingBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  if (pendingBookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-dark mb-2">Sem reservas pendentes</h3>
        <p className="text-gray-500">Todas as reservas foram aprovadas ou rejeitadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <span className="font-semibold">{pendingBookings.length}</span> reserva{pendingBookings.length !== 1 ? 's' : ''} pendente{pendingBookings.length !== 1 ? 's' : ''} de aprovação
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Alojamento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Hóspede</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Datas</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Hóspedes</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Nacionalidade</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-dark">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pendingBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-dark">
                  {ACCOMMODATIONS[booking.accommodation_id] || `ID: ${booking.accommodation_id}`}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-dark">{booking.primary_name}</div>
                  {booking.additional_names && (
                    <div className="text-xs text-gray-500">{booking.additional_names}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-dark">
                  {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                </td>
                <td className="px-4 py-3 text-sm text-dark">{booking.guests}</td>
                <td className="px-4 py-3 text-sm text-dark">{booking.nationality}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleApprove(booking)}
                      disabled={updating === booking.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {updating === booking.id ? '...' : '✓ Aprovar'}
                    </button>
                    <button
                      onClick={() => handleReject(booking)}
                      disabled={updating === booking.id}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {updating === booking.id ? '...' : '✗ Rejeitar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {pendingBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-primary font-medium mb-1">
                  {ACCOMMODATIONS[booking.accommodation_id]}
                </div>
                <div className="font-semibold text-dark">{booking.primary_name}</div>
                {booking.additional_names && (
                  <div className="text-sm text-gray-500">{booking.additional_names}</div>
                )}
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Pendente
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>
                <span className="text-gray-500">Check-in:</span>
                <div className="font-medium">{formatDate(booking.check_in)}</div>
              </div>
              <div>
                <span className="text-gray-500">Check-out:</span>
                <div className="font-medium">{formatDate(booking.check_out)}</div>
              </div>
              <div>
                <span className="text-gray-500">Hóspedes:</span>
                <div className="font-medium">{booking.guests}</div>
              </div>
              <div>
                <span className="text-gray-500">Nacionalidade:</span>
                <div className="font-medium">{booking.nationality}</div>
              </div>
            </div>

            {booking.notes && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-4">
                {booking.notes}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(booking)}
                disabled={updating === booking.id}
                className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {updating === booking.id ? '...' : '✓ Aprovar'}
              </button>
              <button
                onClick={() => handleReject(booking)}
                disabled={updating === booking.id}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {updating === booking.id ? '...' : '✗ Rejeitar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
