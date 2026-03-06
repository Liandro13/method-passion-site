// Constants for Teams Portal

export const ACCOMMODATIONS = [
  { id: 1, name: 'Esperança Terrace', shortName: 'Esperança' },
  { id: 2, name: 'Nattura Gerês Village', shortName: 'Nattura' },
  { id: 3, name: 'Douro & Sabor Escape', shortName: 'Douro' }
];

export const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  confirmed: { bg: '#22c55e', border: '#16a34a' },
  pending: { bg: '#eab308', border: '#ca8a04' },
  cancelled: { bg: '#6b7280', border: '#4b5563' }
};
