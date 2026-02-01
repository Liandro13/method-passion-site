import { useState, useMemo } from 'react';
import { updateBooking, createBooking } from '../lib/api';
import type { Booking } from '../types';
import BookingModal from './BookingModal';
import StatusBadge from './ui/StatusBadge';
import { ACCOMMODATION_MAP, STATUS_OPTIONS, PLATFORM_OPTIONS, ACCOMMODATIONS } from '../constants';
import { formatDate } from '../utils/formatters';
import { exportBookingsToCSV } from '../utils/exportCsv';
import { useBookings } from '../hooks/useBookings';
import { useBookingActions } from '../hooks/useBookingActions';

interface BookingsListViewProps {
  onBookingChange?: () => void;
  initialStatusFilter?: string;
  showAccommodationFilter?: boolean;
}

export default function BookingsListView({ onBookingChange, initialStatusFilter, showAccommodationFilter = true }: BookingsListViewProps) {
  // Use centralized hooks
  const { bookings, blockedDates, loading, reload } = useBookings({});
  const { updatingId, handleQuickApprove, handleQuickReject, handleDelete } = useBookingActions({ 
    onSuccess: () => { reload(); onBookingChange?.(); } 
  });
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || '');
  const [accommodationFilter, setAccommodationFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Ordenação
  const [sortField, setSortField] = useState<keyof Booking>('check_in');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Aplicar filtros e ordenação
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Filtro de pesquisa (nome ou email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.primary_name.toLowerCase().includes(query) ||
        (b.additional_names && b.additional_names.toLowerCase().includes(query)) ||
        (b.notes && b.notes.toLowerCase().includes(query))
      );
    }

    // Filtro de status
    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }

    // Filtro de alojamento
    if (accommodationFilter) {
      result = result.filter(b => b.accommodation_id === Number(accommodationFilter));
    }

    // Filtro de plataforma
    if (platformFilter) {
      result = result.filter(b => b.plataforma === platformFilter);
    }

    // Filtro de data (check-in dentro do intervalo)
    if (dateFrom) {
      result = result.filter(b => b.check_in >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(b => b.check_in <= dateTo);
    }

    // Ordenação
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [bookings, searchQuery, statusFilter, accommodationFilter, platformFilter, dateFrom, dateTo, sortField, sortDirection]);

  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
          accommodation_id: data.accommodation_id || 1,
          check_in: data.check_in,
          check_out: data.check_out,
          guests: data.guests,
          nationality: data.nationality,
          primary_name: data.primary_name,
          additional_names: data.additional_names,
          notes: data.notes
        });
      }
      await reload();
      onBookingChange?.();
      setShowBookingModal(false);
      setEditingBooking(null);
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const exportToCSV = () => exportBookingsToCSV(filteredBookings, 'reservas', true);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setAccommodationFilter('');
    setPlatformFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || statusFilter || accommodationFilter || platformFilter || dateFrom || dateTo;

  const SortIcon = ({ field }: { field: keyof Booking }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
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
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pesquisa */}
          <div>
            <input
              type="text"
              placeholder="🔍 Pesquisar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
            />
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Alojamento */}
          {showAccommodationFilter && (
            <div>
              <select
                value={accommodationFilter}
                onChange={(e) => setAccommodationFilter(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Todos os alojamentos</option>
                {ACCOMMODATIONS.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Plataforma */}
          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="input-field w-full"
            >
              {PLATFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <div className="md:col-span-2 flex gap-2 items-center">
            <span className="text-sm text-gray-500 whitespace-nowrap">Check-in de:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field flex-1"
            />
            <span className="text-sm text-gray-500">a:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field flex-1"
            />
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-dark transition-colors"
              >
                ✕ Limpar filtros
              </button>
            )}
            <button
              onClick={() => {
                setEditingBooking(null);
                setShowBookingModal(true);
              }}
              className="btn-primary text-sm"
            >
              + Nova Reserva
            </button>
            <button
              onClick={exportToCSV}
              className="btn-secondary text-sm"
              title="Exportar reservas filtradas"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          <span>
            {filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''} encontrada{filteredBookings.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <span className="text-primary">Filtros ativos</span>
          )}
        </div>
      </div>

      {/* Tabela Desktop */}
      <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Nenhuma reserva encontrada com os filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('accommodation_id')}
                  >
                    Alojamento <SortIcon field="accommodation_id" />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('primary_name')}
                  >
                    Hóspede <SortIcon field="primary_name" />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('check_in')}
                  >
                    Check-in <SortIcon field="check_in" />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('check_out')}
                  >
                    Check-out <SortIcon field="check_out" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark">
                    Hósp.
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Estado <SortIcon field="status" />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('plataforma')}
                  >
                    Plataforma <SortIcon field="plataforma" />
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-sm font-semibold text-dark cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('valor')}
                  >
                    Valor <SortIcon field="valor" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-dark">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-dark">
                        {ACCOMMODATION_MAP[booking.accommodation_id] || `ID: ${booking.accommodation_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-dark">{booking.primary_name}</div>
                      <div className="text-xs text-gray-500">{booking.nationality}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark">
                      {formatDate(booking.check_in)}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark">
                      {formatDate(booking.check_out)}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark text-center">
                      {booking.guests}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.plataforma || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark text-right font-medium">
                      {booking.valor ? `€${booking.valor.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {/* Ações rápidas para pendentes */}
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleQuickApprove(booking)}
                              disabled={updatingId === booking.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Aprovar"
                            >
                              {updatingId === booking.id ? '...' : '✓'}
                            </button>
                            <button
                              onClick={() => handleQuickReject(booking)}
                              disabled={updatingId === booking.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Rejeitar"
                            >
                              {updatingId === booking.id ? '...' : '✗'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setEditingBooking(booking);
                            setShowBookingModal(true);
                          }}
                          className="p-1.5 text-primary hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(booking)}
                          disabled={updatingId === booking.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cards Mobile/Tablet */}
      <div className="lg:hidden space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Nenhuma reserva encontrada</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs text-primary font-medium mb-1">
                    {ACCOMMODATION_MAP[booking.accommodation_id]}
                  </div>
                  <div className="font-semibold text-dark">{booking.primary_name}</div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
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
                  <span className="text-gray-500">Plataforma:</span>
                  <div className="font-medium">{booking.plataforma || '-'}</div>
                </div>
              </div>

              {booking.valor && (
                <div className="text-lg font-semibold text-dark mb-3">
                  €{booking.valor.toFixed(2)}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleQuickApprove(booking)}
                      disabled={updatingId === booking.id}
                      className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === booking.id ? '...' : '✓ Aprovar'}
                    </button>
                    <button
                      onClick={() => handleQuickReject(booking)}
                      disabled={updatingId === booking.id}
                      className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {updatingId === booking.id ? '...' : '✗ Rejeitar'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setEditingBooking(booking);
                    setShowBookingModal(true);
                  }}
                  className="flex-1 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showBookingModal && (
        <BookingModal
          booking={editingBooking}
          defaultDates={null}
          accommodationId={editingBooking?.accommodation_id || null}
          showAccommodationSelector={!editingBooking}
          existingBookings={bookings}
          blockedDates={blockedDates}
          onSave={handleSaveBooking}
          onDelete={editingBooking ? () => handleDelete(editingBooking) : undefined}
          onClose={() => {
            setShowBookingModal(false);
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
}
