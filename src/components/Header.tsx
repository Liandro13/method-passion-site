import type { Language } from '../types';

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
  return (
    <header className="bg-dark text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/images/logo.jpeg" 
              alt="Method & Passion Logo" 
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                Method & Passion
              </h1>
              <p className="text-sm opacity-80 mt-1">Alojamento Local</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-accent text-white px-3 py-2 rounded-lg border border-gray-600 
                         focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
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
