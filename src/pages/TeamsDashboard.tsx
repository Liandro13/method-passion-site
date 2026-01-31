import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

interface Booking {
  id: number;
  accommodation_id: number;
  accommodation_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  nationality: string;
  primary_name: string;
  additional_names?: string;
  notes?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    booking: Booking;
  };
}

const ACCOMMODATION_COLORS: Record<number, { bg: string; border: string }> = {
  1: { bg: '#3b82f6', border: '#2563eb' }, // blue - Esperança Terrace
  2: { bg: '#22c55e', border: '#16a34a' }, // green - Nattura Gerês Village
  3: { bg: '#a855f7', border: '#9333ea' }, // purple - Douro & Sabor Escape
};

const ACCOMMODATION_NAMES: Record<number, string> = {
  1: 'Esperança Terrace',
  2: 'Nattura Gerês Village',
  3: 'Douro & Sabor Escape'
};

export default function TeamsDashboard() {
  const { isLoaded, role, name, allowedAccommodations } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const navigate = useNavigate();

  // Check access
  useEffect(() => {
    if (isLoaded && role !== 'team' && role !== 'admin') {
      navigate('/teams');
    }
  }, [isLoaded, role, navigate]);

  const loadBookings = useCallback(async () => {
    if (!allowedAccommodations.length) {
      setLoading(false);
      return;
    }

    try {
      // Fetch bookings for each allowed accommodation
      const allBookings: Booking[] = [];
      
      for (const accId of allowedAccommodations) {
        const response = await fetch(`/api/bookings?accommodation_id=${accId}&status=confirmed`);
        const result = await response.json();
        
        if (result.bookings) {
          allBookings.push(...result.bookings.map((b: Booking) => ({
            ...b,
            accommodation_name: ACCOMMODATION_NAMES[b.accommodation_id] || `Alojamento ${b.accommodation_id}`
          })));
        }
      }
      
      setBookings(allBookings);
      
      // Convert to calendar events
      const calendarEvents: CalendarEvent[] = allBookings.map((booking: Booking) => {
        const colors = ACCOMMODATION_COLORS[booking.accommodation_id] || { bg: '#6b7280', border: '#4b5563' };
        return {
          id: `booking-${booking.id}`,
          title: booking.primary_name,
          start: booking.check_in,
          end: booking.check_out,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          extendedProps: { booking }
        };
      });
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [allowedAccommodations]);

  useEffect(() => {
    if (isLoaded && (role === 'team' || role === 'admin')) {
      loadBookings();
    }
  }, [isLoaded, role, loadBookings]);

  const handleEventClick = (clickInfo: { event: { extendedProps: Record<string, unknown> } }) => {
    const booking = clickInfo.event.extendedProps.booking as Booking;
    if (booking) setSelectedBooking(booking);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-dark text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Method & Passion</h1>
            <p className="text-sm opacity-80">Olá, {name}</p>
          </div>
          <UserButton afterSignOutUrl="/teams" />
        </div>
      </header>

      {/* View Toggle */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📅 Calendário
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📋 Lista
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-dark mb-2">Sem reservas</h3>
            <p className="text-gray-500">Não há reservas confirmadas para os seus alojamentos.</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl shadow-lg p-4 overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: 'today'
              }}
              locale="pt"
              height="auto"
              eventDisplay="block"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white mb-2"
                      style={{ backgroundColor: ACCOMMODATION_COLORS[booking.accommodation_id]?.bg || '#6b7280' }}
                    >
                      {booking.accommodation_name}
                    </span>
                    <div className="font-semibold text-dark">{booking.primary_name}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-dark">{booking.guests} hóspedes</div>
                    <div className="text-gray-500">{booking.nationality}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl md:rounded-xl shadow-xl w-full md:max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark">Detalhes da Reserva</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div
                className="inline-block px-3 py-1 rounded text-sm font-medium text-white"
                style={{ backgroundColor: ACCOMMODATION_COLORS[selectedBooking.accommodation_id]?.bg || '#6b7280' }}
              >
                {selectedBooking.accommodation_name}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Check-in</div>
                  <div className="font-medium text-dark">{formatDate(selectedBooking.check_in)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Check-out</div>
                  <div className="font-medium text-dark">{formatDate(selectedBooking.check_out)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Responsável</div>
                <div className="font-medium text-dark text-lg">{selectedBooking.primary_name}</div>
              </div>

              {selectedBooking.additional_names && (
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Outros Hóspedes</div>
                  <div className="text-dark">{selectedBooking.additional_names}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Nº Hóspedes</div>
                  <div className="font-medium text-dark">{selectedBooking.guests}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Nacionalidade</div>
                  <div className="font-medium text-dark">{selectedBooking.nationality}</div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Notas</div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-dark">
                    {selectedBooking.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <footer className="bg-white border-t border-gray-200 py-3 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: ACCOMMODATION_COLORS[1].bg }} />
            <span className="text-gray-600">Esperança Terrace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: ACCOMMODATION_COLORS[2].bg }} />
            <span className="text-gray-600">Nattura Gerês Village</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: ACCOMMODATION_COLORS[3].bg }} />
            <span className="text-gray-600">Douro & Sabor Escape</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
