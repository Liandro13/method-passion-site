import { useState, useEffect, useMemo } from 'react';
import type { Booking } from '../types';

const ACCOMMODATIONS = [
  { id: 1, name: 'Esperança Terrace' },
  { id: 2, name: 'Nattura Gerês Village' },
  { id: 3, name: 'Douro & Sabor Escape' }
];

interface BookingModalProps {
  booking: Booking | null;
  defaultDates: { start: string; end: string } | null;
  accommodationId?: number | null;
  showAccommodationSelector?: boolean;
  onSave: (data: {
    check_in: string;
    check_out: string;
    guests: number;
    nationality: string;
    primary_name: string;
    additional_names?: string;
    notes?: string;
    status?: string;
    accommodation_id?: number;
    // Financial fields
    valor?: number;
    imposto_municipal?: number;
    comissao?: number;
    taxa_bancaria?: number;
    valor_sem_comissoes?: number;
    valor_sem_iva?: number;
    iva?: number;
    plataforma?: string;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function BookingModal({ booking, defaultDates, accommodationId, showAccommodationSelector, onSave, onDelete, onClose }: BookingModalProps) {
  const [selectedAccommodation, setSelectedAccommodation] = useState(accommodationId || 1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [nationality, setNationality] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [additionalNames, setAdditionalNames] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  
  // Financial fields
  const [valor, setValor] = useState<number>(0);
  const [impostoMunicipal, setImpostoMunicipal] = useState<number>(0);
  const [comissao, setComissao] = useState<number>(0);
  const [taxaBancaria, setTaxaBancaria] = useState<number>(0);
  const [iva, setIva] = useState<number>(0);
  const [plataforma, setPlataforma] = useState('');
  const [showFinancialError, setShowFinancialError] = useState(false);

  // Auto-calculated fields
  const valorSemComissoes = useMemo(() => {
    return Math.round((valor - comissao - taxaBancaria) * 100) / 100;
  }, [valor, comissao, taxaBancaria]);

  const valorSemIva = useMemo(() => {
    return Math.round((valorSemComissoes - iva) * 100) / 100;
  }, [valorSemComissoes, iva]);

  useEffect(() => {
    if (booking) {
      setSelectedAccommodation(booking.accommodation_id);
      setCheckIn(booking.check_in);
      setCheckOut(booking.check_out);
      setGuests(booking.guests);
      setNationality(booking.nationality);
      setPrimaryName(booking.primary_name);
      setAdditionalNames(booking.additional_names || '');
      setNotes(booking.notes || '');
      setStatus(booking.status || 'pending');
      // Financial fields
      setValor(booking.valor || 0);
      setImpostoMunicipal(booking.imposto_municipal || 0);
      setComissao(booking.comissao || 0);
      setTaxaBancaria(booking.taxa_bancaria || 0);
      setIva(booking.iva || 0);
      setPlataforma(booking.plataforma || '');
    } else {
      if (accommodationId) setSelectedAccommodation(accommodationId);
      if (defaultDates) {
        setCheckIn(defaultDates.start);
        setCheckOut(defaultDates.end);
      }
      setStatus('pending');
    }
  }, [booking, defaultDates, accommodationId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate financial fields are required when confirming
    if (status === 'confirmed' && (!valor || valor <= 0 || !plataforma)) {
      setShowFinancialError(true);
      return;
    }
    setShowFinancialError(false);
    
    onSave({
      check_in: checkIn,
      check_out: checkOut,
      guests,
      nationality,
      primary_name: primaryName,
      additional_names: additionalNames,
      notes,
      status,
      accommodation_id: selectedAccommodation,
      // Financial fields
      valor,
      imposto_municipal: impostoMunicipal,
      comissao,
      taxa_bancaria: taxaBancaria,
      valor_sem_comissoes: valorSemComissoes,
      valor_sem_iva: valorSemIva,
      iva,
      plataforma
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
          {/* Seletor de alojamento (só para novas reservas) */}
          {showAccommodationSelector && !booking && (
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Alojamento *</label>
              <select
                value={selectedAccommodation}
                onChange={(e) => setSelectedAccommodation(Number(e.target.value))}
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

          {/* Status selector - only shown when editing */}
          {booking && (
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'confirmed' | 'cancelled')}
                className="input-field"
              >
                <option value="pending">🟡 Pendente</option>
                <option value="confirmed">🟢 Confirmado</option>
                <option value="cancelled">⚫ Cancelado</option>
              </select>
            </div>
          )}

          {/* Financial fields - only shown when editing */}
          {booking && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-dark mb-3">
                Dados Financeiros
                {status === 'confirmed' && <span className="text-red-500 text-sm ml-2">(obrigatório)</span>}
              </h3>
              
              {showFinancialError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4">
                  Para confirmar a reserva, preencha o valor e a plataforma.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Valor Total (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor || ''}
                    onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Plataforma *</label>
                  <select
                    value={plataforma}
                    onChange={(e) => setPlataforma(e.target.value)}
                    className="input-field"
                  >
                    <option value="">--</option>
                    <option value="Airbnb">Airbnb</option>
                    <option value="Booking">Booking</option>
                    <option value="VRBO">VRBO</option>
                    <option value="Direto">Direto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Imposto Municipal (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={impostoMunicipal || ''}
                    onChange={(e) => setImpostoMunicipal(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Comissão (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={comissao || ''}
                    onChange={(e) => setComissao(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">Taxa Bancária (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxaBancaria || ''}
                    onChange={(e) => setTaxaBancaria(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">IVA (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={iva || ''}
                    onChange={(e) => setIva(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Auto-calculated fields */}
              <div className="grid grid-cols-2 gap-4 mt-4 bg-beige/50 p-3 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-dark/70 mb-1">Valor s/ Comissões</label>
                  <div className="text-lg font-semibold text-dark">€ {valorSemComissoes.toFixed(2)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark/70 mb-1">Valor s/ IVA</label>
                  <div className="text-lg font-semibold text-dark">€ {valorSemIva.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

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
