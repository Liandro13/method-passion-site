import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getBookings, getBlockedDates, deleteBlockedDate } from '../lib/api';
import type { Booking, BlockedDate, CalendarEvent } from '../types';
import BookingModal from './BookingModal';
import BlockedDateModal from './BlockedDateModal';
import { createBooking, updateBooking, deleteBooking, createBlockedDate } from '../lib/api';

// Cores fixas por alojamento
const ACCOMMODATION_COLORS: Record<number, { bg: string; border: string; name: string }> = {
  1: { bg: '#3B82F6', border: '#2563EB', name: 'Esperança Terrace' },
  2: { bg: '#10B981', border: '#059669', name: 'Nattura Gerês Village' },
  3: { bg: '#F59E0B', border: '#D97706', name: 'Douro & Sabor Escape' }
};

interface CalendarViewProps {
  onBookingChange?: () => void;
}

export default function CalendarView({ onBookingChange }: CalendarViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: string; end: string } | null>(null);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  
  // Filtros de alojamento (todos activos por defeito)
  const [visibleAccommodations, setVisibleAccommodations] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, blockedRes] = await Promise.all([
        getBookings(), // Carregar todas as reservas
        getBlockedDates() // Carregar todos os bloqueios
      ]);

      if (bookingsRes.bookings) setBookings(bookingsRes.bookings);
      if (blockedRes.blockedDates) setBlockedDates(blockedRes.blockedDates);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Converter dados em eventos do calendário
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Filtrar apenas os alojamentos visíveis
    const filteredBookings = bookings.filter(b => visibleAccommodations[b.accommodation_id]);
    const filteredBlocked = blockedDates.filter(b => visibleAccommodations[b.accommodation_id]);

    filteredBookings.forEach(booking => {
      const accColor = ACCOMMODATION_COLORS[booking.accommodation_id] || ACCOMMODATION_COLORS[1];
      const statusLabel = booking.status === 'pending' ? ' ⏳' : 
                          booking.status === 'cancelled' ? ' ❌' : '';
      
      // Ajustar opacidade baseado no status
      let bgColor = accColor.bg;
      if (booking.status === 'cancelled') {
        bgColor = '#9CA3AF'; // cinzento para cancelados
      } else if (booking.status === 'pending') {
        bgColor = accColor.bg + 'CC'; // adiciona transparência
      }

      calendarEvents.push({
        id: `booking-${booking.id}`,
        title: `${booking.primary_name}${statusLabel}`,
        start: booking.check_in,
        end: booking.check_out,
        backgroundColor: bgColor,
        borderColor: booking.status === 'cancelled' ? '#6B7280' : accColor.border,
        extendedProps: {
          type: 'booking',
          bookingId: booking.id,
          status: booking.status,
          accommodationId: booking.accommodation_id
        }
      });
    });

    filteredBlocked.forEach(blocked => {
      calendarEvents.push({
        id: `blocked-${blocked.id}`,
        title: `🚫 ${blocked.reason || 'Bloqueado'}`,
        start: blocked.start_date,
        end: blocked.end_date,
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        extendedProps: {
          type: 'blocked',
          blockedId: blocked.id,
          accommodationId: blocked.accommodation_id
        }
      });
    });

    setEvents(calendarEvents);
  }, [bookings, blockedDates, visibleAccommodations]);

  const handleDateSelect = (selectInfo: { startStr: string; endStr: string }) => {
    setSelectedDates({ start: selectInfo.startStr, end: selectInfo.endStr });
    setSelectedAccommodationId(null);
    setShowBookingModal(true);
  };

  const handleEventClick = (clickInfo: { event: { extendedProps: Record<string, unknown> } }) => {
    const extendedProps = clickInfo.event.extendedProps as { 
      type?: string; 
      bookingId?: number; 
      blockedId?: number;
      accommodationId?: number;
    };
    const { type, bookingId, blockedId } = extendedProps;
    
    if (type === 'booking' && bookingId) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setEditingBooking(booking);
        setSelectedAccommodationId(booking.accommodation_id);
        setShowBookingModal(true);
      }
    } else if (type === 'blocked' && blockedId) {
      if (confirm('Remover este bloqueio?')) {
        deleteBlockedDate(blockedId).then(() => {
          loadData();
          onBookingChange?.();
        });
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
    accommodation_id?: number;
  }) => {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, data);
      } else {
        await createBooking({
          accommodation_id: data.accommodation_id || selectedAccommodationId || 1,
          check_in: data.check_in,
          check_out: data.check_out,
          guests: data.guests,
          nationality: data.nationality,
          primary_name: data.primary_name,
          additional_names: data.additional_names,
          notes: data.notes
        });
      }
      await loadData();
      onBookingChange?.();
      setShowBookingModal(false);
      setEditingBooking(null);
      setSelectedDates(null);
      setSelectedAccommodationId(null);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (confirm('Tem a certeza que deseja eliminar esta reserva?')) {
      try {
        await deleteBooking(id);
        await loadData();
        onBookingChange?.();
        setShowBookingModal(false);
        setEditingBooking(null);
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const handleSaveBlocked = async (data: { 
    start_date: string; 
    end_date: string; 
    reason?: string;
    accommodation_id?: number;
  }) => {
    try {
      await createBlockedDate({
        accommodation_id: data.accommodation_id || 1,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason
      });
      await loadData();
      onBookingChange?.();
      setShowBlockedModal(false);
    } catch (error) {
      console.error('Error saving blocked date:', error);
    }
  };

  const toggleAccommodation = (id: number) => {
    setVisibleAccommodations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legenda e filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Legenda de alojamentos (clicável para filtrar) */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(ACCOMMODATION_COLORS).map(([id, color]) => (
              <button
                key={id}
                onClick={() => toggleAccommodation(Number(id))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  visibleAccommodations[Number(id)]
                    ? 'border-gray-300 bg-white'
                    : 'border-gray-200 bg-gray-100 opacity-50'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color.bg }}
                />
                <span className="text-sm font-medium text-dark">{color.name}</span>
              </button>
            ))}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingBooking(null);
                setSelectedDates(null);
                setSelectedAccommodationId(null);
                setShowBookingModal(true);
              }}
              className="btn-primary text-sm"
            >
              + Nova Reserva
            </button>
            <button
              onClick={() => setShowBlockedModal(true)}
              className="btn-secondary text-sm"
            >
              + Bloquear Datas
            </button>
          </div>
        </div>

        {/* Legenda de estados */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Confirmado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> ⏳ Pendente
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> ❌ Cancelado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> 🚫 Bloqueado
          </span>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
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

      {/* Modals */}
      {showBookingModal && (
        <BookingModal
          booking={editingBooking}
          defaultDates={selectedDates}
          accommodationId={selectedAccommodationId}
          showAccommodationSelector={!editingBooking}
          onSave={handleSaveBooking}
          onDelete={editingBooking ? () => handleDeleteBooking(editingBooking.id) : undefined}
          onClose={() => {
            setShowBookingModal(false);
            setEditingBooking(null);
            setSelectedDates(null);
            setSelectedAccommodationId(null);
          }}
        />
      )}

      {showBlockedModal && (
        <BlockedDateModal
          showAccommodationSelector={true}
          onSave={handleSaveBlocked}
          onClose={() => setShowBlockedModal(false)}
        />
      )}
    </div>
  );
}
