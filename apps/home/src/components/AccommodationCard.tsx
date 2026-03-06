import { useState } from 'react';
import type { Accommodation, Language } from '@method-passion/shared';
import { Icon } from '@method-passion/shared';

interface AccommodationCardProps {
  accommodation: Accommodation;
  language: Language;
  primaryImage: string;
  description: string;
  features: readonly string[];
  onClick: () => void;
  index?: number;
}

export default function AccommodationCard({ accommodation, language, primaryImage, description, features, onClick, index = 0 }: AccommodationCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageCount = accommodation.images?.length || 0;

  return (
    <div 
      onClick={onClick} 
      className="group cursor-pointer"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Image Container with enhanced effects */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-lg transition-shadow duration-500 group-hover:shadow-2xl">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite'
            }} />
          </div>
        )}
        <img 
          src={primaryImage} 
          alt={accommodation.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Gradient overlay - always visible subtle, stronger on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        {/* Image count badge */}
        {imageCount > 1 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-medium flex items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imageCount}
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg drop-shadow-lg" style={{ fontFamily: 'var(--font-family-serif)' }}>
            {accommodation.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Icon.Users className="w-3.5 h-3.5 text-primary-light" />
            <span className="text-white/90 text-sm">{accommodation.max_guests} {language === 'pt' ? 'hóspedes' : 'guests'}</span>
          </div>
        </div>
        
        {/* View button on hover - animated entrance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <span className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold shadow-xl 
                           transform translate-y-4 group-hover:translate-y-0 transition-all duration-500
                           hover:bg-primary-dark">
            {language === 'pt' ? 'Ver detalhes' : language === 'fr' ? 'Voir les détails' : language === 'de' ? 'Details ansehen' : language === 'es' ? 'Ver detalles' : 'View details'}
          </span>
        </div>
      </div>

      {/* Content - refined */}
      <div className="space-y-2 px-1">
        {description && (
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{description}</p>
        )}

        {features.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {features.slice(0, 3).map((feature, idx) => (
              <span 
                key={idx} 
                className="text-xs text-primary-dark/80 bg-primary/10 px-2.5 py-1 rounded-full
                           transition-all duration-300 group-hover:bg-primary/20 group-hover:text-primary-dark"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
