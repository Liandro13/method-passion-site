// API client for the booking system

const API_BASE = '/api';

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
  
  const response = await fetch(url, { credentials: 'include' });
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
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteBooking(id: number) {
  const response = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return response.json();
}

export async function getBlockedDates(accommodationId?: number) {
  const url = accommodationId 
    ? `${API_BASE}/blocked-dates?accommodation_id=${accommodationId}`
    : `${API_BASE}/blocked-dates`;
  const response = await fetch(url, { credentials: 'include' });
  return response.json();
}

export async function createBlockedDate(data: {
  accommodation_id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}) {
  const response = await fetch(`${API_BASE}/blocked-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteBlockedDate(id: number) {
  const response = await fetch(`${API_BASE}/blocked-dates/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return response.json();
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

export async function logout() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  return response.json();
}

export async function checkAuth() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include'
  });
  return response.json();
}

export async function getAccommodations() {
  const response = await fetch(`${API_BASE}/accommodations`);
  return response.json();
}
