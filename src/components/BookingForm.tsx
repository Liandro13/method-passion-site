import { useState, useEffect } from 'react';
import { checkAvailability } from '../lib/api';
import type { Language } from '../types';

interface BookingFormProps {
  accommodation: string;
  maxGuests: number;
  language: Language;
  translations: {
    bookingTitle: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    nationality: string;
    responsibleName: string;
    additionalNames: string;
    addName: string;
    removeName: string;
    submitBooking: string;
    nationalities: Record<string, string>;
    datesUnavailable: string;
    fillAllFields: string;
  };
}

const WHATSAPP_NUMBER = '+351968950410';

export default function BookingForm({
  accommodation,
  maxGuests,
  language,
  translations: t
}: BookingFormProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [nationality, setNationality] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [additionalNames, setAdditionalNames] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [blockedDates, setBlockedDates] = useState<{checkIn: string; checkOut: string}[]>([]);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Load blocked dates when accommodation changes
  useEffect(() => {
    checkAvailability(accommodation, '', '').then(result => {
      if (result.bookedDates) {
        setBlockedDates(result.bookedDates);
      }
    }).catch(() => {});
  }, [accommodation]);

  const addName = () => {
    setAdditionalNames([...additionalNames, '']);
  };

  const removeName = (index: number) => {
    setAdditionalNames(additionalNames.filter((_, i) => i !== index));
  };

  const updateName = (index: number, value: string) => {
    const updated = [...additionalNames];
    updated[index] = value;
    setAdditionalNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fields
    if (!checkIn || !checkOut || !nationality || !primaryName) {
      setError(t.fillAllFields);
      return;
    }

    setChecking(true);

    try {
      // Check availability
      const result = await checkAvailability(accommodation, checkIn, checkOut);
      
      if (!result.available) {
        setError(t.datesUnavailable);
        setChecking(false);
        return;
      }

      // Build WhatsApp message
      const allNames = [primaryName, ...additionalNames.filter(n => n.trim())].join(', ');
      
      const messages: Record<Language, string> = {
        pt: `*Nova Reserva*\n\n*Alojamento:* ${accommodation}\n*Check-in:* ${checkIn}\n*Check-out:* ${checkOut}\n*Hóspedes:* ${guests}\n*Nacionalidade:* ${t.nationalities[nationality] || nationality}\n*Nomes:* ${allNames}`,
        en: `*New Booking*\n\n*Accommodation:* ${accommodation}\n*Check-in:* ${checkIn}\n*Check-out:* ${checkOut}\n*Guests:* ${guests}\n*Nationality:* ${t.nationalities[nationality] || nationality}\n*Names:* ${allNames}`,
        fr: `*Nouvelle Réservation*\n\n*Hébergement:* ${accommodation}\n*Arrivée:* ${checkIn}\n*Départ:* ${checkOut}\n*Invités:* ${guests}\n*Nationalité:* ${t.nationalities[nationality] || nationality}\n*Noms:* ${allNames}`,
        de: `*Neue Buchung*\n\n*Unterkunft:* ${accommodation}\n*Anreise:* ${checkIn}\n*Abreise:* ${checkOut}\n*Gäste:* ${guests}\n*Nationalität:* ${t.nationalities[nationality] || nationality}\n*Namen:* ${allNames}`,
        es: `*Nueva Reserva*\n\n*Alojamiento:* ${accommodation}\n*Entrada:* ${checkIn}\n*Salida:* ${checkOut}\n*Huéspedes:* ${guests}\n*Nacionalidad:* ${t.nationalities[nationality] || nationality}\n*Nombres:* ${allNames}`
      };

      const message = encodeURIComponent(messages[language]);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}?text=${message}`;
      
      window.open(whatsappUrl, '_blank');
    } catch {
      setError('Error checking availability');
    } finally {
      setChecking(false);
    }
  };

  // Check if a date is blocked
  const isDateBlocked = (date: string) => {
    return blockedDates.some(range => {
      return date >= range.checkIn && date < range.checkOut;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <h2 className="text-xl font-semibold text-dark mb-6">{t.bookingTitle}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              {t.checkIn} *
            </label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut('');
                }
              }}
              className={`input-field ${isDateBlocked(checkIn) ? 'border-red-500' : ''}`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              {t.checkOut} *
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              {t.guests} *
            </label>
            <input
              type="number"
              value={guests}
              min={1}
              max={maxGuests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              {t.nationality} *
            </label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="input-field"
              required
            >
              <option value="">--</option>
              {Object.entries(t.nationalities).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            {t.responsibleName} *
          </label>
          <input
            type="text"
            value={primaryName}
            onChange={(e) => setPrimaryName(e.target.value)}
            className="input-field"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            {t.additionalNames}
          </label>
          
          {additionalNames.map((name, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={name}
                onChange={(e) => updateName(index, e.target.value)}
                className="input-field flex-1"
                placeholder="Name"
              />
              <button
                type="button"
                onClick={() => removeName(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t.removeName}
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addName}
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            + {t.addName}
          </button>
        </div>

        <button
          type="submit"
          disabled={checking}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {checking ? '...' : t.submitBooking}
        </button>
      </form>
    </div>
  );
}
