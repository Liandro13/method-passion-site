import { useState } from 'react';
import type { Accommodation, Language } from '@method-passion/shared';

interface AccommodationCardProps {
  accommodation: Accommodation;
  language: Language;
  primaryImage: string;
  description: string;
  features: readonly string[];
  onClick: () => void;
}

export default function AccommodationCard({ accommodation, language, primaryImage, description, features, onClick }: AccommodationCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageCount = accommodation.images?.length || 0;

  return (
    <div onClick={onClick} className="group cursor-pointer">
      {/* Image Container */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
        <img 
          src={primaryImage} 
          alt={accommodation.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Image count badge */}
        {imageCount > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imageCount}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
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
          <h3 className="font-semibold text-dark group-hover:text-primary transition-colors">{accommodation.name}</h3>
          <div className="flex items-center gap-1 text-gray-500 text-sm flex-shrink-0">
            <span>👥</span>
            <span>{accommodation.max_guests}</span>
          </div>
        </div>
        
        {description && <p className="text-gray-500 text-sm line-clamp-2">{description}</p>}

        {features.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs text-gray-400">
                {feature}{idx < 2 && idx < features.length - 1 && ' •'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
