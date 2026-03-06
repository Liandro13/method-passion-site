// Types for the Teams Portal

export interface Booking {
  id: number;
  accommodation_id: number;
  accommodation_name?: string;
  check_in: string;
  check_out: string;
  guests: number;
  nationality: string;
  primary_name: string;
  additional_names: string;
  notes: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: number;
  accommodation_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'booking' | 'blocked';
    bookingId?: number;
    blockedId?: number;
    status?: string;
    accommodationId?: number;
  };
}
