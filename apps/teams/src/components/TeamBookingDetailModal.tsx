import type { Booking } from '../types';
import { formatDate } from '../utils/formatters';

interface TeamBookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
}

export default function TeamBookingDetailModal({ booking, onClose }: TeamBookingDetailModalProps) {
  // Calculate number of nights
  const checkInDate = new Date(booking.check_in);
  const checkOutDate = new Date(booking.check_out);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-dark">Detalhes da Reserva</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hóspede */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Hóspede</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-dark">{booking.primary_name}</div>
              {booking.additional_names && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-gray-500">Outros hóspedes:</span> {booking.additional_names}
                </div>
              )}
              {booking.nationality && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-gray-500">Nacionalidade:</span> {booking.nationality}
                </div>
              )}
            </div>
          </div>

          {/* Datas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Estadia</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Check-in</div>
                  <div className="text-lg font-semibold text-dark">{formatDate(booking.check_in)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Check-out</div>
                  <div className="text-lg font-semibold text-dark">{formatDate(booking.check_out)}</div>
                </div>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200">
                <div>
                  <span className="text-gray-500 text-sm">Noites:</span>
                  <span className="ml-1 font-semibold">{nights}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Hóspedes:</span>
                  <span className="ml-1 font-semibold">{booking.guests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alojamento */}
          {booking.accommodation_name && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Alojamento</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-dark">{booking.accommodation_name}</div>
              </div>
            </div>
          )}

          {/* Notas */}
          {booking.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
