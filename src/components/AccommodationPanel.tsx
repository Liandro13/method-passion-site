import { useState, useEffect, useCallback, useMemo } from 'react';
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
  onBookingChange?: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os estados' },
  { value: 'confirmed', label: '🟢 Confirmado' },
  { value: 'pending', label: '🟡 Pendente' },
  { value: 'cancelled', label: '⚫ Cancelado' }
];

const PLATFORM_OPTIONS = [
  { value: '', label: 'Todas as plataformas' },
  { value: 'Airbnb', label: 'Airbnb' },
  { value: 'Booking', label: 'Booking' },
  { value: 'VRBO', label: 'VRBO' },
  { value: 'Direto', label: 'Direto' }
];

export default function AccommodationPanel({ accommodationId, accommodationName, onBookingChange }: AccommodationPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ start: string; end: string } | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
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
      const statusColors: Record<string, { bg: string; border: string }> = {
        confirmed: { bg: '#22c55e', border: '#16a34a' },
        pending: { bg: '#eab308', border: '#ca8a04' },
        cancelled: { bg: '#6b7280', border: '#4b5563' }
      };
      const colors = statusColors[booking.status] || statusColors.pending;
      const statusLabel = booking.status === 'pending' ? ' ⏳' : 
                          booking.status === 'cancelled' ? ' ❌' : '';

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

    setEvents(calendarEvents);
  }, [bookings, blockedDates]);

  // Filtrar reservas para a lista
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.primary_name.toLowerCase().includes(query) ||
        (b.additional_names && b.additional_names.toLowerCase().includes(query))
      );
    }
    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }
    if (platformFilter) {
      result = result.filter(b => b.plataforma === platformFilter);
    }
    if (dateFrom) {
      result = result.filter(b => b.check_in >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(b => b.check_in <= dateTo);
    }

    // Ordenar por check_in descendente
    result.sort((a, b) => b.check_in.localeCompare(a.check_in));

    return result;
  }, [bookings, searchQuery, statusFilter, platformFilter, dateFrom, dateTo]);

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
  }) => {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, data);
      } else {
        await createBooking({
          accommodation_id: accommodationId,
          ...data
        });
      }
      await loadData();
      onBookingChange?.();
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
        onBookingChange?.();
        setShowBookingModal(false);
        setEditingBooking(null);
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const handleQuickApprove = async (booking: Booking) => {
    setUpdating(booking.id);
    try {
      await updateBooking(booking.id, { status: 'confirmed' });
      await loadData();
      onBookingChange?.();
    } catch (error) {
      console.error('Error approving booking:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleQuickReject = async (booking: Booking) => {
    if (!confirm('Tem certeza que deseja rejeitar esta reserva?')) return;
    setUpdating(booking.id);
    try {
      await updateBooking(booking.id, { status: 'cancelled' });
      await loadData();
      onBookingChange?.();
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveBlocked = async (data: { start_date: string; end_date: string; reason?: string }) => {
    try {
      await createBlockedDate({
        accommodation_id: accommodationId,
        ...data
      });
      await loadData();
      onBookingChange?.();
      setShowBlockedModal(false);
    } catch (error) {
      console.error('Error saving blocked date:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Hóspede', 'Check-in', 'Check-out', 'Hóspedes', 'Nacionalidade', 'Estado', 'Plataforma', 'Valor', 'Notas'];
    const rows = filteredBookings.map(b => [
      b.id, b.primary_name, b.check_in, b.check_out, b.guests, b.nationality,
      b.status, b.plataforma || '', b.valor || '', (b.notes || '').replace(/"/g, '""')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservas_${accommodationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPlatformFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || statusFilter || platformFilter || dateFrom || dateTo;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    const labels: Record<string, string> = { confirmed: '🟢 Confirmado', pending: '🟡 Pendente', cancelled: '⚫ Cancelado' };
    return <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-12 text-gray-500">A carregar...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header com nome do alojamento e ações */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-dark">{accommodationName}</h2>
            <p className="text-sm text-gray-500">{bookings.length} reservas • {pendingCount} pendentes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingBooking(null);
                setSelectedDates(null);
                setShowBookingModal(true);
              }}
              className="btn-primary text-sm"
            >
              + Nova Reserva
            </button>
            <button onClick={() => setShowBlockedModal(true)} className="btn-secondary text-sm">
              + Bloquear
            </button>
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
            📋 Lista {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">{pendingCount}</span>}
          </button>
        </div>
      </div>

      {/* Calendário */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Confirmado</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> Pendente</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-500" /> Cancelado</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Bloqueado</span>
          </div>
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
      )}

      {/* Lista com filtros */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="🔍 Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="input-field">
                {PLATFORM_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-3 py-2 text-sm text-gray-600 hover:text-dark">✕ Limpar</button>
                )}
                <button onClick={exportToCSV} className="btn-secondary text-sm flex-1">📥 CSV</button>
              </div>
            </div>
            <div className="flex gap-2 mt-3 items-center">
              <span className="text-sm text-gray-500">Check-in:</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field text-sm" />
              <span className="text-sm text-gray-500">a</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field text-sm" />
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
                    <th className="px-4 py-3 text-center font-semibold text-dark">Hósp.</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold text-dark">Plataforma</th>
                    <th className="px-4 py-3 text-right font-semibold text-dark">Valor</th>
                    <th className="px-4 py-3 text-right font-semibold text-dark">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-dark">{booking.primary_name}</div>
                        <div className="text-xs text-gray-500">{booking.nationality}</div>
                      </td>
                      <td className="px-4 py-3">{formatDate(booking.check_in)}</td>
                      <td className="px-4 py-3">{formatDate(booking.check_out)}</td>
                      <td className="px-4 py-3 text-center">{booking.guests}</td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3 text-gray-600">{booking.plataforma || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">{booking.valor ? `€${booking.valor.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {booking.status === 'pending' && (
                            <>
                              <button onClick={() => handleQuickApprove(booking)} disabled={updating === booking.id} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Aprovar">
                                {updating === booking.id ? '...' : '✓'}
                              </button>
                              <button onClick={() => handleQuickReject(booking)} disabled={updating === booking.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Rejeitar">
                                {updating === booking.id ? '...' : '✗'}
                              </button>
                            </>
                          )}
                          <button onClick={() => { setEditingBooking(booking); setShowBookingModal(true); }} className="p-1.5 text-primary hover:bg-blue-50 rounded" title="Editar">✏️</button>
                          <button onClick={() => handleDeleteBooking(booking.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">🗑️</button>
                        </div>
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
                <div key={booking.id} className="bg-white rounded-xl shadow-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-dark">{booking.primary_name}</div>
                      <div className="text-xs text-gray-500">{booking.nationality}</div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm my-3">
                    <div><span className="text-gray-500">Check-in:</span> <div className="font-medium">{formatDate(booking.check_in)}</div></div>
                    <div><span className="text-gray-500">Check-out:</span> <div className="font-medium">{formatDate(booking.check_out)}</div></div>
                    <div><span className="text-gray-500">Hóspedes:</span> <div className="font-medium">{booking.guests}</div></div>
                    <div><span className="text-gray-500">Plataforma:</span> <div className="font-medium">{booking.plataforma || '-'}</div></div>
                  </div>
                  {booking.valor && <div className="text-lg font-semibold text-dark mb-3">€{booking.valor.toFixed(2)}</div>}
                  <div className="flex gap-2 pt-3 border-t">
                    {booking.status === 'pending' && (
                      <>
                        <button onClick={() => handleQuickApprove(booking)} disabled={updating === booking.id} className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg">{updating === booking.id ? '...' : '✓ Aprovar'}</button>
                        <button onClick={() => handleQuickReject(booking)} disabled={updating === booking.id} className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg">{updating === booking.id ? '...' : '✗ Rejeitar'}</button>
                      </>
                    )}
                    <button onClick={() => { setEditingBooking(booking); setShowBookingModal(true); }} className="flex-1 py-2 bg-primary text-white text-sm rounded-lg">✏️ Editar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showBookingModal && (
        <BookingModal
          booking={editingBooking}
          defaultDates={selectedDates}
          accommodationId={accommodationId}
          onSave={handleSaveBooking}
          onDelete={editingBooking ? () => handleDeleteBooking(editingBooking.id) : undefined}
          onClose={() => { setShowBookingModal(false); setEditingBooking(null); setSelectedDates(null); }}
        />
      )}

      {showBlockedModal && (
        <BlockedDateModal
          defaultAccommodationId={accommodationId}
          onSave={handleSaveBlocked}
          onClose={() => setShowBlockedModal(false)}
        />
      )}
    </div>
  );
}
