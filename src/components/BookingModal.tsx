import { useState, useEffect } from 'react';
import type { Booking } from '../types';

interface BookingModalProps {
  booking: Booking | null;
  defaultDates: { start: string; end: string } | null;
  onSave: (data: {
    check_in: string;
    check_out: string;
    guests: number;
    nationality: string;
    primary_name: string;
    additional_names?: string;
    notes?: string;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function BookingModal({ booking, defaultDates, onSave, onDelete, onClose }: BookingModalProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [nationality, setNationality] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [additionalNames, setAdditionalNames] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (booking) {
      setCheckIn(booking.check_in);
      setCheckOut(booking.check_out);
      setGuests(booking.guests);
      setNationality(booking.nationality);
      setPrimaryName(booking.primary_name);
      setAdditionalNames(booking.additional_names || '');
      setNotes(booking.notes || '');
    } else if (defaultDates) {
      setCheckIn(defaultDates.start);
      setCheckOut(defaultDates.end);
    }
  }, [booking, defaultDates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      check_in: checkIn,
      check_out: checkOut,
      guests,
      nationality,
      primary_name: primaryName,
      additional_names: additionalNames,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-dark">
            {booking ? 'Editar Reserva' : 'Nova Reserva'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Check-in *</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Check-out *</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Hóspedes *</label>
              <input
                type="number"
                value={guests}
                min={1}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Nacionalidade *</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="input-field"
                required
              >
                <option value="">--</option>
                <option value="PT">Portugal</option>
                <option value="ES">Espanha</option>
                <option value="FR">França</option>
                <option value="DE">Alemanha</option>
                <option value="UK">Reino Unido</option>
                <option value="US">Estados Unidos</option>
                <option value="IT">Itália</option>
                <option value="NL">Holanda</option>
                <option value="BE">Bélgica</option>
                <option value="BR">Brasil</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Nome do Responsável *</label>
            <input
              type="text"
              value={primaryName}
              onChange={(e) => setPrimaryName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Nomes Adicionais</label>
            <textarea
              value={additionalNames}
              onChange={(e) => setAdditionalNames(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Outros hóspedes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Observações..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {booking ? 'Guardar' : 'Criar Reserva'}
            </button>
            {booking && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
