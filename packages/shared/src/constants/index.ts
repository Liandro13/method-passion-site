// Shared constants

export const ACCOMMODATIONS = [
  { id: 1, name: 'Esperança Terrace', shortName: 'Esperança' },
  { id: 2, name: 'Nattura Gerês Village', shortName: 'Nattura' },
  { id: 3, name: 'Douro & Sabor Escape', shortName: 'Douro' }
] as const;

export const ACCOMMODATION_MAP: Record<number, string> = Object.fromEntries(
  ACCOMMODATIONS.map(a => [a.id, a.name])
);

export const ACCOMMODATION_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: '#c9a961', border: '#b8984d', text: 'white' },
  2: { bg: '#4a7c59', border: '#3d6649', text: 'white' },
  3: { bg: '#8b5a2b', border: '#724a23', text: 'white' }
};

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos os estados' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'cancelled', label: 'Cancelado' }
] as const;

export const STATUS_COLORS: Record<string, { bg: string; border: string; badgeClass: string }> = {
  confirmed: { bg: '#22c55e', border: '#16a34a', badgeClass: 'bg-green-100 text-green-800' },
  pending: { bg: '#eab308', border: '#ca8a04', badgeClass: 'bg-yellow-100 text-yellow-800' },
  cancelled: { bg: '#6b7280', border: '#4b5563', badgeClass: 'bg-gray-100 text-gray-600' }
};

export const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado'
};

export const PLATFORM_OPTIONS = [
  { value: '', label: 'Todas as plataformas' },
  { value: 'Airbnb', label: 'Airbnb' },
  { value: 'Booking', label: 'Booking' },
  { value: 'VRBO', label: 'VRBO' },
  { value: 'Direto', label: 'Direto' }
] as const;

export const LANGUAGES = ['pt', 'en', 'fr', 'de', 'es'] as const;
export type LanguageCode = typeof LANGUAGES[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español'
};
