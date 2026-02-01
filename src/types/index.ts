// Types for the booking system

export interface AccommodationImage {
  id: number;
  accommodation_id: number;
  image_url: string;
  display_order: number;
  caption?: string;
  is_primary: boolean;
  created_at?: string;
}

export interface Accommodation {
  id: number;
  name: string;
  description_pt: string;
  description_en: string;
  description_fr?: string;
  description_de?: string;
  description_es?: string;
  image_url: string;
  max_guests: number;
  images?: AccommodationImage[];
  primary_image?: string;
  amenities?: Record<string, string[]>;
}

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
  // Financial fields (required when confirmed)
  valor?: number;
  imposto_municipal?: number;
  comissao?: number;
  taxa_bancaria?: number;
  valor_sem_comissoes?: number;
  valor_sem_iva?: number;
  iva?: number;
  plataforma?: string;
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

export type Language = 'pt' | 'en' | 'fr' | 'de' | 'es';

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
