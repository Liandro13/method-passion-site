import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Accommodation, AccommodationImage, Language } from '@method-passion/shared';
import { Icon } from '@method-passion/shared';
import { translations } from '../lib/i18n';
import BookingForm from './BookingForm';

interface AccommodationModalProps {
  accommodation: Accommodation;
  language: Language;
  description: string;
  features: readonly string[];
  onClose: () => void;
}

export default function AccommodationModal({ accommodation, language, description, features, onClose }: AccommodationModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'book'>('photos');
  const t = translations[language];
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
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
                <span className="flex items-center gap-1"><Icon.Users className="w-4 h-4" /> {accommodation.max_guests} {language === 'pt' ? 'hóspedes' : 'guests'}</span>
                <span className="flex items-center gap-1"><Icon.Camera className="w-4 h-4" /> {images.length} {language === 'pt' ? 'fotos' : 'photos'}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex gap-6 px-6">
              {(['photos', 'book'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 border-b-2 transition-colors font-medium text-sm ${
                    activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'photos' ? (language === 'pt' ? 'Fotografias' : 'Photos') : (language === 'pt' ? 'Reservar' : 'Book')}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'photos' ? (
              <div className="space-y-6">
                {sortedImages.length > 0 ? (
                  <ImageGallery images={sortedImages} accommodationName={accommodation.name} />
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400">{language === 'pt' ? 'Sem fotografias' : 'No photos'}</span>
                  </div>
                )}

                {description && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-lg font-semibold text-dark mb-2">{language === 'pt' ? 'Sobre este alojamento' : 'About this accommodation'}</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}

                {features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-dark mb-3">{language === 'pt' ? 'Comodidades' : 'Amenities'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg">
                          <span className="text-primary"><Icon.Check className="w-4 h-4" /></span>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setActiveTab('book')} className="w-full btn-primary py-4 text-lg font-semibold">
                  {language === 'pt' ? 'Reservar agora' : 'Book now'}
                </button>
              </div>
            ) : (
              <BookingForm accommodation={accommodation.name} maxGuests={accommodation.max_guests} language={language} translations={t} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Gallery Component
function ImageGallery({ images, accommodationName }: { images: AccommodationImage[]; accommodationName: string }) {
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
        <div className="overflow-hidden rounded-xl cursor-pointer" ref={emblaRef} onClick={() => setShowFullscreen(true)}>
          <div className="flex">
            {images.map((img, idx) => (
              <div key={img.id} className="flex-[0_0_100%] min-w-0">
                <div className="aspect-[16/10] relative">
                  <img src={img.image_url} alt={img.caption || `${accommodationName} ${idx + 1}`} className="w-full h-full object-cover" />
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

        {images.length > 1 && (
          <>
            <NavButton direction="prev" onClick={(e) => { e.stopPropagation(); scrollPrev(); }} />
            <NavButton direction="next" onClick={(e) => { e.stopPropagation(); scrollNext(); }} />
            <Dots count={images.length} selected={selectedIndex} onClick={(idx) => emblaApi?.scrollTo(idx)} />
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                idx === selectedIndex ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.image_url} alt={img.caption || `Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {showFullscreen && (
        <FullscreenGallery images={images} initialIndex={selectedIndex} accommodationName={accommodationName} onClose={() => setShowFullscreen(false)} />
      )}
    </>
  );
}

// Fullscreen Gallery
function FullscreenGallery({ images, initialIndex, accommodationName, onClose }: { images: AccommodationImage[]; initialIndex: number; accommodationName: string; onClose: () => void }) {
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
      <div className="flex items-center justify-between p-4">
        <span className="text-white text-sm">{currentIndex + 1} / {images.length}</span>
        <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div key={img.id} className="flex-[0_0_100%] min-w-0 flex items-center justify-center p-4">
              <img src={img.image_url} alt={img.caption || `${accommodationName} ${idx + 1}`} className="max-w-full max-h-full object-contain" />
            </div>
          ))}
        </div>
      </div>

      <NavButton direction="prev" onClick={scrollPrev} dark />
      <NavButton direction="next" onClick={scrollNext} dark />

      {images[currentIndex]?.caption && (
        <div className="p-4 text-center"><span className="text-white/80 text-sm">{images[currentIndex].caption}</span></div>
      )}

      <div className="flex justify-center gap-2 pb-6">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'}`}
          />
        ))}
      </div>
    </div>
  );
}

// Shared components
function NavButton({ direction, onClick, dark }: { direction: 'prev' | 'next'; onClick: (e: React.MouseEvent) => void; dark?: boolean }) {
  const isPrev = direction === 'prev';
  return (
    <button
      onClick={onClick}
      className={`absolute ${isPrev ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-${dark ? '3' : '2'} ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/90 hover:bg-white'} rounded-full ${dark ? '' : 'shadow-lg'} transition-colors`}
    >
      <svg className={`w-${dark ? '6' : '5'} h-${dark ? '6' : '5'} ${dark ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPrev ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

function Dots({ count, selected, onClick }: { count: number; selected: number; onClick: (idx: number) => void }) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
      {Array.from({ length: count }).map((_, idx) => (
        <button
          key={idx}
          onClick={(e) => { e.stopPropagation(); onClick(idx); }}
          className={`w-2 h-2 rounded-full transition-all ${idx === selected ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'}`}
        />
      ))}
    </div>
  );
}
