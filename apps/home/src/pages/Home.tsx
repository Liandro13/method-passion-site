import { useState, useEffect } from 'react';
import Header from '../components/Header';
import AccommodationCard from '../components/AccommodationCard';
import AccommodationModal from '../components/AccommodationModal';
import { translations } from '../lib/i18n';
import { getAccommodations } from '@method-passion/shared';
import type { Language, Accommodation } from '@method-passion/shared';

export default function Home() {
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const t = translations[language];

  useEffect(() => {
    async function loadAccommodations() {
      try {
        const result = await getAccommodations();
        if (result.accommodations) setAccommodations(result.accommodations);
      } catch (error) {
        console.error('Error loading accommodations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAccommodations();
  }, []);

  const getDescription = (acc: Accommodation) => {
    const key = `description_${language}` as keyof Accommodation;
    return (acc[key] as string) || acc.description_pt || acc.description_en || '';
  };

  const getPrimaryImage = (acc: Accommodation) => {
    if (!acc.images || acc.images.length === 0) return acc.image_url || '/images/logo.jpeg';
    const primary = acc.images.find(img => img.is_primary);
    return primary?.image_url || acc.images[0]?.image_url || acc.image_url || '/images/logo.jpeg';
  };

  const getFeatures = (acc: Accommodation) => t.accommodations[acc.name as keyof typeof t.accommodations]?.features || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-dark via-accent to-dark text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {language === 'pt' ? 'Descubra o seu refúgio perfeito' : 'Discover your perfect retreat'}
            </h1>
            <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
              {language === 'pt' 
                ? 'Alojamentos únicos em Portugal, onde a natureza encontra o conforto'
                : 'Unique accommodations in Portugal, where nature meets comfort'}
            </p>
          </div>
        </section>

        {/* Accommodations Grid */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold text-dark mb-8">{t.selectAccommodation}</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map(acc => (
                <AccommodationCard
                  key={acc.id}
                  accommodation={acc}
                  language={language}
                  primaryImage={getPrimaryImage(acc)}
                  description={getDescription(acc)}
                  features={getFeatures(acc)}
                  onClick={() => setSelectedAccommodation(acc)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {selectedAccommodation && (
        <AccommodationModal
          accommodation={selectedAccommodation}
          language={language}
          description={getDescription(selectedAccommodation)}
          features={getFeatures(selectedAccommodation)}
          onClose={() => setSelectedAccommodation(null)}
        />
      )}

      <footer className="bg-dark text-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-80">© 2026 Method & Passion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
