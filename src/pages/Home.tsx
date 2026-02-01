import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Header from '../components/Header';
import BookingForm from '../components/BookingForm';
import { translations } from '../lib/i18n';
import { getAccommodations } from '../lib/api';
import type { Language, Accommodation, AccommodationImage } from '../types';

export default function Home() {
  const [language, setLanguage] = useState<Language>('pt');
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const t = translations[language];

  useEffect(() => {
    async function loadAccommodations() {
      try {
        const result = await getAccommodations();
        if (result.accommodations) {
          setAccommodations(result.accommodations);
        }
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

  const openAccommodation = (acc: Accommodation) => {
    setSelectedAccommodation(acc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const getPrimaryImage = (acc: Accommodation) => {
    if (!acc.images || acc.images.length === 0) return acc.image_url || '/images/logo.jpeg';
    const primary = acc.images.find(img => img.is_primary);
    return primary?.image_url || acc.images[0]?.image_url || acc.image_url || '/images/logo.jpeg';
  };

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
                : 'Unique accommodations in Portugal, where nature meets comfort'
              }
            </p>
          </div>
        </section>

        {/* Accommodations Grid */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold text-dark mb-8">
            {t.selectAccommodation}
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((acc) => (
                <AccommodationCard
                  key={acc.id}
                  accommodation={acc}
                  language={language}
                  primaryImage={getPrimaryImage(acc)}
                  description={getDescription(acc)}
                  features={t.accommodations[acc.name as keyof typeof t.accommodations]?.features || []}
                  onClick={() => openAccommodation(acc)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Accommodation Detail Modal */}
      {showModal && selectedAccommodation && (
        <AccommodationModal
          accommodation={selectedAccommodation}
          language={language}
          description={getDescription(selectedAccommodation)}
          features={t.accommodations[selectedAccommodation.name as keyof typeof t.accommodations]?.features || []}
          translations={t}
          onClose={closeModal}
        />
      )}

      <footer className="bg-dark text-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            © 2026 Method & Passion. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Compact Accommodation Card
interface CardProps {
  accommodation: Accommodation;
  language: Language;
  primaryImage: string;
  description: string;
  features: readonly string[];
  onClick: () => void;
}

function AccommodationCard({ accommodation, language, primaryImage, description, features, onClick }: CardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageCount = accommodation.images?.length || 0;

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img 
          src={primaryImage} 
          alt={accommodation.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Image count badge */}
        {imageCount > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg 
                          text-white text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imageCount}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* View button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-dark shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            {language === 'pt' ? 'Ver detalhes' : 'View details'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dark group-hover:text-primary transition-colors">
            {accommodation.name}
          </h3>
          <div className="flex items-center gap-1 text-gray-500 text-sm flex-shrink-0">
            <span>👥</span>
            <span>{accommodation.max_guests}</span>
          </div>
        </div>
        
        {description && (
          <p className="text-gray-500 text-sm line-clamp-2">
            {description}
          </p>
        )}

        {/* Features preview */}
        {features.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {features.slice(0, 3).map((feature, idx) => (
              <span 
                key={idx}
                className="text-xs text-gray-400"
              >
                {feature}{idx < 2 && idx < features.length - 1 && ' •'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Full-screen Modal with Gallery and Booking
interface ModalProps {
  accommodation: Accommodation;
  language: Language;
  description: string;
  features: readonly string[];
  translations: (typeof import('../lib/i18n').translations)[Language];
  onClose: () => void;
}

function AccommodationModal({ accommodation, language, description, features, translations: t, onClose }: ModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'book'>('photos');
  
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const images = accommodation.images || [];
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 md:p-8">
        <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-dark">{accommodation.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <span>👥</span> {accommodation.max_guests} {language === 'pt' ? 'hóspedes' : 'guests'}
                </span>
                <span className="flex items-center gap-1">
                  <span>📷</span> {images.length} {language === 'pt' ? 'fotos' : 'photos'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex gap-6 px-6">
              <button
                onClick={() => setActiveTab('photos')}
                className={`py-3 border-b-2 transition-colors font-medium text-sm ${
                  activeTab === 'photos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {language === 'pt' ? '📷 Fotografias' : '📷 Photos'}
              </button>
              <button
                onClick={() => setActiveTab('book')}
                className={`py-3 border-b-2 transition-colors font-medium text-sm ${
                  activeTab === 'book'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {language === 'pt' ? '📅 Reservar' : '📅 Book'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'photos' ? (
              <div className="space-y-6">
                {/* Gallery Carousel */}
                {sortedImages.length > 0 ? (
                  <ModalGallery images={sortedImages} accommodationName={accommodation.name} />
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400">{language === 'pt' ? 'Sem fotografias' : 'No photos'}</span>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-lg font-semibold text-dark mb-2">
                      {language === 'pt' ? 'Sobre este alojamento' : 'About this accommodation'}
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}

                {/* Features */}
                {features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-dark mb-3">
                      {language === 'pt' ? 'Comodidades' : 'Amenities'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {features.map((feature, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg"
                        >
                          <span className="text-primary">✓</span>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => setActiveTab('book')}
                  className="w-full btn-primary py-4 text-lg font-semibold"
                >
                  {language === 'pt' ? 'Reservar agora' : 'Book now'}
                </button>
              </div>
            ) : (
              <BookingForm
                accommodation={accommodation.name}
                maxGuests={accommodation.max_guests}
                language={language}
                translations={t}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Gallery component for modal
interface GalleryProps {
  images: AccommodationImage[];
  accommodationName: string;
}

function ModalGallery({ images, accommodationName }: GalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  return (
    <>
      <div className="relative">
        {/* Main Carousel */}
        <div 
          className="overflow-hidden rounded-xl cursor-pointer" 
          ref={emblaRef}
          onClick={() => setShowFullscreen(true)}
        >
          <div className="flex">
            {images.map((img, idx) => (
              <div key={img.id} className="flex-[0_0_100%] min-w-0">
                <div className="aspect-[16/10] relative">
                  <img 
                    src={img.image_url} 
                    alt={img.caption || `${accommodationName} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-white text-sm">{img.caption}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); scrollNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); emblaApi?.scrollTo(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === selectedIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                idx === selectedIndex 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img 
                src={img.image_url} 
                alt={img.caption || `Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Gallery */}
      {showFullscreen && (
        <FullscreenGallery 
          images={images}
          initialIndex={selectedIndex}
          accommodationName={accommodationName}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </>
  );
}

// Fullscreen gallery overlay
interface FullscreenProps {
  images: AccommodationImage[];
  initialIndex: number;
  accommodationName: string;
  onClose: () => void;
}

function FullscreenGallery({ images, initialIndex, accommodationName, onClose }: FullscreenProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialIndex });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, scrollPrev, scrollNext]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="text-white text-sm">{currentIndex + 1} / {images.length}</span>
        <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Gallery */}
      <div className="flex-1 flex items-center" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div key={img.id} className="flex-[0_0_100%] min-w-0 flex items-center justify-center p-4">
              <img 
                src={img.image_url} 
                alt={img.caption || `${accommodationName} ${idx + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Caption */}
      {images[currentIndex]?.caption && (
        <div className="p-4 text-center">
          <span className="text-white/80 text-sm">{images[currentIndex].caption}</span>
        </div>
      )}

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-6">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
