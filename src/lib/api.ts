// API client for the booking system

const API_BASE = '/api';

// Token getter function - will be set by useClerkToken hook
let getAuthToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (getAuthToken) {
    try {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignore auth errors
    }
  }
  
  return headers;
}

export async function checkAvailability(accommodation: string, checkIn: string, checkOut: string) {
  const response = await fetch(`${API_BASE}/check-availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accommodation, checkIn, checkOut })
  });
  return response.json();
}

export async function getBookings(accommodationId?: number, status?: string) {
  let url = `${API_BASE}/bookings`;
  const params = new URLSearchParams();
  
  if (accommodationId) params.append('accommodation_id', accommodationId.toString());
  if (status) params.append('status', status);
  
  if (params.toString()) url += `?${params.toString()}`;
  
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers, credentials: 'include' });
  return response.json();
}

export async function createBooking(data: {
  accommodation_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nationality: string;
  primary_name: string;
  additional_names?: string;
  notes?: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function updateBooking(id: number, data: Partial<{
  check_in: string;
  check_out: string;
  guests: number;
  nationality: string;
  primary_name: string;
  additional_names: string;
  notes: string;
  status: string;
}>) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteBooking(id: number) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include'
  });
  return response.json();
}

export async function getBlockedDates(accommodationId?: number) {
  const url = accommodationId 
    ? `${API_BASE}/blocked-dates?accommodation_id=${accommodationId}`
    : `${API_BASE}/blocked-dates`;
  const headers = await getAuthHeaders();
  const response = await fetch(url, { headers, credentials: 'include' });
  return response.json();
}

export async function createBlockedDate(data: {
  accommodation_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/blocked-dates`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteBlockedDate(id: number) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/blocked-dates/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include'
  });
  return response.json();
}

// Auth is now handled by Clerk - these functions are kept for backwards compatibility
// but shouldn't be used anymore

export async function getAccommodations() {
  const response = await fetch(`${API_BASE}/accommodations`);
  return response.json();
}

// === Accommodation Management ===

export async function updateAccommodation(id: number, data: {
  name?: string;
  description_pt?: string;
  description_en?: string;
  description_fr?: string;
  description_de?: string;
  description_es?: string;
  max_guests?: number;
  amenities?: Record<string, string[]>;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/accommodations`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ id, ...data })
  });
  return response.json();
}

// === Image Management ===

export async function getAccommodationImages(accommodationId?: number) {
  const url = accommodationId 
    ? `${API_BASE}/images?accommodation_id=${accommodationId}`
    : `${API_BASE}/images`;
  const response = await fetch(url);
  return response.json();
}

export async function uploadImage(file: File, accommodationId: number, caption?: string) {
  const headers = await getAuthHeaders();
  // Remove Content-Type to let browser set it for FormData
  delete headers['Content-Type'];

  const formData = new FormData();
  formData.append('file', file);
  formData.append('accommodation_id', accommodationId.toString());
  if (caption) {
    formData.append('caption', caption);
  }

  const response = await fetch(`${API_BASE}/images`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData
  });
  return response.json();
}

export async function updateImage(id: number, data: {
  display_order?: number;
  caption?: string;
  is_primary?: boolean;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/images`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ id, ...data })
  });
  return response.json();
}

export async function reorderImages(images: { id: number }[]) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/images`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ reorder: images })
  });
  return response.json();
}

export async function deleteImage(id: number) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/images?id=${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include'
  });
  return response.json();
}
