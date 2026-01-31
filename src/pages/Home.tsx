import { useState } from 'react';
import Header from '../components/Header';
import AccommodationCard from '../components/AccommodationCard';
import BookingForm from '../components/BookingForm';
import { translations } from '../lib/i18n';
import type { Language } from '../types';

const accommodations = [
  {
    id: 1,
    name: 'Esperança Terrace',
    image: '/images/esperança.jpeg',
    maxGuests: 8
  },
  {
    id: 2,
    name: 'Nattura Gerês Village',
    image: '/images/geres.jpeg',
    maxGuests: 10
  },
  {
    id: 3,
    name: 'Douro & Sabor Escape',
    image: '/images/moncorvo.jpeg',
    maxGuests: 8
  }
];

export default function Home() {
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedAccommodation, setSelectedAccommodation] = useState<string | null>(null);
  
  const t = translations[language];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1">
        {/* Accommodation Selection */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-dark mb-6 text-center">
            {t.selectAccommodation}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accommodations.map((acc) => (
              <AccommodationCard
                key={acc.id}
                name={acc.name}
                image={acc.image}
                features={t.accommodations[acc.name as keyof typeof t.accommodations]?.features || []}
                isSelected={selectedAccommodation === acc.name}
                onClick={() => setSelectedAccommodation(acc.name)}
              />
            ))}
          </div>
        </section>

        {/* Booking Form */}
        {selectedAccommodation && (
          <section className="max-w-2xl mx-auto">
            <BookingForm
              accommodation={selectedAccommodation}
              maxGuests={accommodations.find(a => a.name === selectedAccommodation)?.maxGuests || 8}
              language={language}
              translations={t}
            />
          </section>
        )}
      </main>

      <footer className="bg-dark text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            © 2026 Method & Passion. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
