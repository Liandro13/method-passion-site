import { useState } from 'react';
import { ACCOMMODATIONS } from '../constants';

interface BlockedDateModalProps {
  showAccommodationSelector?: boolean;
  defaultAccommodationId?: number;
  onSave: (data: { start_date: string; end_date: string; reason?: string; accommodation_id?: number }) => void;
  onClose: () => void;
}

export default function BlockedDateModal({ showAccommodationSelector, defaultAccommodationId, onSave, onClose }: BlockedDateModalProps) {
  const [accommodationId, setAccommodationId] = useState(defaultAccommodationId || 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      start_date: startDate,
      end_date: endDate,
      reason: reason || undefined,
      accommodation_id: accommodationId
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-dark">Bloquear Datas</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Seletor de alojamento */}
          {showAccommodationSelector && (
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Alojamento *</label>
              <select
                value={accommodationId}
                onChange={(e) => setAccommodationId(Number(e.target.value))}
                className="input-field"
                required
              >
                {ACCOMMODATIONS.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Data Início *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Data Fim *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              placeholder="Manutenção, férias pessoais..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-secondary flex-1">
              Bloquear
            </button>
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
