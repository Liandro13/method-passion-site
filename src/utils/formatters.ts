// Centralized formatting utilities

/**
 * Format a date string to Portuguese locale format (DD/MM/YYYY)
 */
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format a date string to long format (e.g., "15 de Janeiro de 2026")
 */
export const formatDateLong = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format currency to EUR
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

/**
 * Check if two date ranges overlap
 */
export const datesOverlap = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  return start1 < end2 && end1 > start2;
};

/**
 * Calculate number of nights between two dates
 */
export const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
