// CSV export utilities

import { ACCOMMODATION_MAP } from '@method-passion/shared';
import type { Booking } from '@method-passion/shared';

export function exportBookingsToCSV(
  bookings: Booking[], 
  filename: string,
  includeAccommodation = true
) {
  const headers = includeAccommodation
    ? ['ID', 'Alojamento', 'Hóspede', 'Check-in', 'Check-out', 'Hóspedes', 'Nacionalidade', 'Estado', 'Plataforma', 'Valor', 'Notas']
    : ['ID', 'Hóspede', 'Check-in', 'Check-out', 'Hóspedes', 'Nacionalidade', 'Estado', 'Plataforma', 'Valor', 'Notas'];

  const rows = bookings.map(b => {
    const base = [
      b.id,
      b.primary_name,
      b.check_in,
      b.check_out,
      b.guests,
      b.nationality,
      b.status,
      b.plataforma || '',
      b.valor || '',
      (b.notes || '').replace(/"/g, '""')
    ];
    
    if (includeAccommodation) {
      base.splice(1, 0, ACCOMMODATION_MAP[b.accommodation_id] || b.accommodation_id);
    }
    
    return base;
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
