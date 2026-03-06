import { useState, useMemo } from 'react';
import type { Booking } from '@method-passion/shared';
import { ACCOMMODATIONS, formatDate, Icon } from '@method-passion/shared';
import TeamBookingDetailModal from './TeamBookingDetailModal';
import StatusBadge from './ui/StatusBadge';
import { useBookings } from '../hooks/useBookings';

interface TeamBookingsListViewProps {
  allowedAccommodations: number[];
}

export default function TeamBookingsListView({ allowedAccommodations }: TeamBookingsListViewProps) {
  const { bookings, loading } = useBookings({});
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [accommodationFilter, setAccommodationFilter] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  
  // Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filter accommodations to only allowed ones
  const allowedAccommodationsList = ACCOMMODATIONS.filter(acc => allowedAccommodations.includes(acc.id));

  // Aplicar filtros
  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Start with confirmed bookings from allowed accommodations
    let result = bookings.filter(b => 
      b.status === 'confirmed' && 
      allowedAccommodations.includes(b.accommodation_id)
    );

    // Filter by type
    if (filterType === 'upcoming') {
      result = result.filter(b => b.check_in >= today);
    } else if (filterType === 'past') {
      result = result.filter(b => b.check_out < today);
    }

    // Filtro de pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.primary_name.toLowerCase().includes(query) ||
        (b.additional_names && b.additional_names.toLowerCase().includes(query)) ||
        (b.notes && b.notes.toLowerCase().includes(query)) ||
        (b.nationality && b.nationality.toLowerCase().includes(query))
      );
    }

    // Filtro de alojamento
    if (accommodationFilter) {
      result = result.filter(b => b.accommodation_id === Number(accommodationFilter));
    }

    // Sort
    result.sort((a, b) => {
      if (filterType === 'past') {
        return b.check_in.localeCompare(a.check_in);
      }
      return a.check_in.localeCompare(b.check_in);
    });

    return result;
  }, [bookings, searchQuery, accommodationFilter, filterType, allowedAccommodations]);

  const clearFilters = () => {
    setSearchQuery('');
    setAccommodationFilter('');
  };

  const hasActiveFilters = searchQuery || accommodationFilter;

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
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Pesquisa */}
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field flex-1"
          />

          {/* Alojamento */}
          {allowedAccommodationsList.length > 1 && (
            <select
              value={accommodationFilter}
              onChange={(e) => setAccommodationFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Todos os alojamentos</option>
              {allowedAccommodationsList.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-3 items-center justify-between">
          {/* Tipo de filtro */}
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

          <div className="flex gap-2 items-center">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-dark"
              >
                <Icon.XMark className="w-3.5 h-3.5 inline" /> Limpar filtros
              </button>
            )}
            <span className="text-sm text-gray-500">{filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
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
                <th className="px-4 py-3 text-left font-semibold text-dark">Alojamento</th>
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
                  <td className="px-4 py-3 text-gray-600">{booking.accommodation_name}</td>
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
                      <Icon.Eye className="w-4 h-4" />
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
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">Nenhuma reserva encontrada</div>
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
              <div className="text-xs text-primary font-medium mb-2">{booking.accommodation_name}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
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
