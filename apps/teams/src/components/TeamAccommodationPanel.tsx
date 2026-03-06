import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { Booking, CalendarEvent } from '../types';
import TeamBookingDetailModal from './TeamBookingDetailModal';
import StatusBadge from './ui/StatusBadge';
import { STATUS_COLORS } from '../constants';
import { formatDate } from '../utils/formatters';
import { useBookings } from '../hooks/useBookings';

interface TeamAccommodationPanelProps {
  accommodationId: number;
  accommodationName: string;
}

export default function TeamAccommodationPanel({ accommodationId, accommodationName }: TeamAccommodationPanelProps) {
  const { bookings, blockedDates, loading } = useBookings({ accommodationId });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

  // Filtros simples
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Convert data to calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Only show confirmed bookings
    bookings.filter(b => b.status === 'confirmed').forEach(booking => {
      const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;

      calendarEvents.push({
        id: `booking-${booking.id}`,
        title: booking.primary_name,
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
        title: `🚫 ${blocked.reason || 'Bloqueado'}`,
        start: blocked.start_date,
        end: blocked.end_date,
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        extendedProps: {
          type: 'blocked',
          blockedId: blocked.id
        }
      });
    });

    return calendarEvents;
  }, [bookings, blockedDates]);

  // Filtrar reservas para a lista
  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let result = bookings.filter(b => b.status === 'confirmed');

    // Filter by type
    if (filterType === 'upcoming') {
      result = result.filter(b => b.check_in >= today);
    } else if (filterType === 'past') {
      result = result.filter(b => b.check_out < today);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.primary_name.toLowerCase().includes(query) ||
        (b.additional_names && b.additional_names.toLowerCase().includes(query)) ||
        (b.nationality && b.nationality.toLowerCase().includes(query))
      );
    }

    // Sort by check_in
    result.sort((a, b) => {
      if (filterType === 'past') {
        return b.check_in.localeCompare(a.check_in);
      }
      return a.check_in.localeCompare(b.check_in);
    });

    return result;
  }, [bookings, searchQuery, filterType]);

  const handleEventClick = (clickInfo: { event: { extendedProps: Record<string, unknown> } }) => {
    const extendedProps = clickInfo.event.extendedProps as { type?: string; bookingId?: number };
    const { type, bookingId } = extendedProps;
    
    if (type === 'booking' && bookingId) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
      }
    }
  };

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const today = new Date().toISOString().split('T')[0];
  const upcomingCount = bookings.filter(b => b.status === 'confirmed' && b.check_in >= today).length;

  if (loading) {
    return <div className="text-center py-12 text-gray-500">A carregar...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-dark">{accommodationName}</h2>
            <p className="text-sm text-gray-500">{confirmedCount} reservas confirmadas • {upcomingCount} próximas</p>
          </div>
        </div>

        {/* Tabs Calendário / Lista */}
        <div className="flex gap-2 mt-4 border-t border-gray-100 pt-4">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'calendar' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📅 Calendário
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📋 Lista
          </button>
        </div>
      </div>

      {/* Calendário */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Confirmado</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Bloqueado</span>
          </div>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
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
      )}

      {/* Lista */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="🔍 Pesquisar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field flex-1"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'upcoming' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Próximas
                </button>
                <button
                  onClick={() => setFilterType('past')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'past' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Passadas
                </button>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Todas
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">{filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Tabela Desktop */}
          <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Nenhuma reserva encontrada</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Hóspede</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Check-in</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Check-out</th>
                    <th className="px-4 py-3 text-center font-semibold text-dark">Hóspedes</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Nacionalidade</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Notas</th>
                    <th className="px-4 py-3 text-center font-semibold text-dark">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-dark">{booking.primary_name}</div>
                        {booking.additional_names && (
                          <div className="text-xs text-gray-500">{booking.additional_names}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatDate(booking.check_in)}</td>
                      <td className="px-4 py-3">{formatDate(booking.check_out)}</td>
                      <td className="px-4 py-3 text-center">{booking.guests}</td>
                      <td className="px-4 py-3 text-gray-600">{booking.nationality || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600 truncate max-w-[200px]" title={booking.notes || ''}>
                          {booking.notes || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => setSelectedBooking(booking)} 
                          className="p-1.5 text-primary hover:bg-blue-50 rounded"
                          title="Ver detalhes"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cards Mobile */}
          <div className="lg:hidden space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">Nenhuma reserva</div>
            ) : (
              filteredBookings.map(booking => (
                <div 
                  key={booking.id} 
                  className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-dark">{booking.primary_name}</div>
                      {booking.additional_names && (
                        <div className="text-xs text-gray-500">{booking.additional_names}</div>
                      )}
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
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
                      <div className="font-medium">{booking.nationality || '-'}</div>
                    </div>
                  </div>
                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                      <span className="text-gray-500">Notas: </span>{booking.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedBooking && (
        <TeamBookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
