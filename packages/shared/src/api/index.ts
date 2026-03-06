// Shared API client
import type { Accommodation } from '../types';

const API_BASE = '/api';

export interface AccommodationsResponse {
  accommodations: Accommodation[];
}

export interface AvailabilityResponse {
  available: boolean;
  bookedDates?: { checkIn: string; checkOut: string }[];
}

// Public endpoints (no auth required)
export async function getAccommodations(): Promise<AccommodationsResponse> {
  const response = await fetch(`${API_BASE}/accommodations`);
  return response.json() as Promise<AccommodationsResponse>;
}

export async function checkAvailability(accommodation: string, checkIn: string, checkOut: string): Promise<AvailabilityResponse> {
  const response = await fetch(`${API_BASE}/check-availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accommodation, checkIn, checkOut })
  });
  return response.json() as Promise<AvailabilityResponse>;
}
