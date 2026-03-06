import type { Language } from '@method-passion/shared';
import { useScrollHeader } from '../hooks/useScrollAnimation';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const scrolled = useScrollHeader();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-dark/95 backdrop-blur-md shadow-2xl py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
            <div className={`relative transition-all duration-500 ${scrolled ? 'h-10 w-10' : 'h-12 w-12'}`}>
              <img 
                src="/images/logo.jpeg" 
                alt="Method & Passion Logo" 
                className="h-full w-full rounded-full object-cover ring-2 ring-primary/50 transition-all duration-500 hover:ring-primary"
              />
              <div className="absolute inset-0 rounded-full animate-pulse-glow opacity-50" />
            </div>
            <div>
              <h1 className={`font-bold text-primary transition-all duration-500 ${
                scrolled ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'
              }`} style={{ fontFamily: 'var(--font-family-serif)' }}>
                Method & Passion
              </h1>
              <p className={`text-sm text-white/70 transition-all duration-500 ${
                scrolled ? 'opacity-0 h-0 mt-0' : 'opacity-100 h-auto mt-1'
              }`}>Alojamento Local</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 animate-fade-in-down" style={{ animationDelay: '0.4s' }}>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-white/20
                         focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer 
                         transition-all duration-300 hover:bg-white/20"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-dark text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
