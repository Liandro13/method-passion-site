import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getBookings, getBlockedDates, createBooking, updateBooking, deleteBooking, createBlockedDate, deleteBlockedDate } from '../lib/api';
import type { Booking, BlockedDate, CalendarEvent } from '../types';
import BookingModal from './BookingModal';
import BlockedDateModal from './BlockedDateModal';

interface AccommodationPanelProps {
  accommodationId: number;
  accommodationName: string;
}

export default function AccommodationPanel({ accommodationId, accommodationName: _name }: AccommodationPanelProps) {
  // _name is available for future use
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: string; end: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [bookingsRes, blockedRes] = await Promise.all([
        getBookings(accommodationId),
        getBlockedDates(accommodationId)
      ]);

      if (bookingsRes.bookings) setBookings(bookingsRes.bookings);
      if (blockedRes.blockedDates) setBlockedDates(blockedRes.blockedDates);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [accommodationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Convert data to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    bookings.forEach(booking => {
      // Color based on status
      const statusColors: Record<string, { bg: string; border: string }> = {
        confirmed: { bg: '#22c55e', border: '#16a34a' }, // green
        pending: { bg: '#eab308', border: '#ca8a04' },   // yellow
        cancelled: { bg: '#6b7280', border: '#4b5563' }  // gray
      };
      const colors = statusColors[booking.status] || statusColors.pending;
      const statusLabel = booking.status === 'pending' ? ' (Pendente)' : 
                          booking.status === 'cancelled' ? ' (Cancelado)' : '';

      calendarEvents.push({
        id: `booking-${booking.id}`,
        title: `${booking.primary_name}${statusLabel}`,
        start: booking.check_in,
        end: booking.check_out,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        extendedProps: {
          type: 'booking',
          bookingId: booking.id,
          status: booking.status
        }
      });
    });

    blockedDates.forEach(blocked => {
      calendarEvents.push({
        id: `blocked-${blocked.id}`,
        title: blocked.reason || 'Bloqueado',
        start: blocked.start_date,
        end: blocked.end_date,
        backgroundColor: '#ef4444', // red
        borderColor: '#dc2626',
        extendedProps: {
          type: 'blocked',
          blockedId: blocked.id
        }
      });
    });

    setEvents(calendarEvents);
  }, [bookings, blockedDates]);

  const handleDateSelect = (selectInfo: { startStr: string; endStr: string }) => {
    setSelectedDates({ start: selectInfo.startStr, end: selectInfo.endStr });
    setShowBookingModal(true);
  };

  const handleEventClick = (clickInfo: { event: { extendedProps: Record<string, unknown> } }) => {
    const extendedProps = clickInfo.event.extendedProps as { type?: string; bookingId?: number; blockedId?: number };
    const { type, bookingId, blockedId } = extendedProps;
    
    if (type === 'booking' && bookingId) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setEditingBooking(booking);
        setShowBookingModal(true);
      }
    } else if (type === 'blocked' && blockedId) {
      if (confirm('Remover este bloqueio?')) {
        deleteBlockedDate(blockedId).then(() => loadData());
      }
    }
  };

  const handleSaveBooking = async (data: {
    check_in: string;
    check_out: string;
    guests: number;
    nationality: string;
    primary_name: string;
    additional_names?: string;
    notes?: string;
    status?: string;
  }) => {
    try {
      if (editingBooking) {
        // Update existing booking
        await updateBooking(editingBooking.id, data);
      } else {
        // Create new booking
        await createBooking({
          accommodation_id: accommodationId,
          ...data
        });
      }
      await loadData();
      setShowBookingModal(false);
      setEditingBooking(null);
      setSelectedDates(null);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (confirm('Tem a certeza que deseja eliminar esta reserva?')) {
      try {
        await deleteBooking(id);
        await loadData();
        setShowBookingModal(false);
        setEditingBooking(null);
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const handleSaveBlocked = async (data: { start_date: string; end_date: string; reason?: string }) => {
    try {
      await createBlockedDate({
        accommodation_id: accommodationId,
        ...data
      });
      await loadData();
      setShowBlockedModal(false);
    } catch (error) {
      console.error('Error saving blocked date:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setEditingBooking(null);
            setSelectedDates(null);
            setShowBookingModal(true);
          }}
          className="btn-primary"
        >
          + Nova Reserva
        </button>
        <button
          onClick={() => setShowBlockedModal(true)}
          className="btn-secondary"
        >
          + Bloquear Datas
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          locale="pt"
          height="auto"
          eventDisplay="block"
        />
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Reservas</h3>
        
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma reserva para este alojamento</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check-in</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check-out</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hóspedes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nacionalidade</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{booking.primary_name}</td>
                    <td className="py-3 px-4">{booking.check_in}</td>
                    <td className="py-3 px-4">{booking.check_out}</td>
                    <td className="py-3 px-4">{booking.guests}</td>
                    <td className="py-3 px-4">{booking.nationality}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingBooking(booking);
                          setShowBookingModal(true);
                        }}
                        className="text-primary hover:underline mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBookingModal && (
        <BookingModal
          booking={editingBooking}
          defaultDates={selectedDates}
          onSave={handleSaveBooking}
          onDelete={editingBooking ? () => handleDeleteBooking(editingBooking.id) : undefined}
          onClose={() => {
            setShowBookingModal(false);
            setEditingBooking(null);
            setSelectedDates(null);
          }}
        />
      )}

      {showBlockedModal && (
        <BlockedDateModal
          onSave={handleSaveBlocked}
          onClose={() => setShowBlockedModal(false)}
        />
      )}
    </div>
  );
}
