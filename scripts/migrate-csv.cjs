#!/usr/bin/env node
/**
 * CSV to SQL Migration Script
 * Converts booking data from CSV files to SQL INSERT statements
 * 
 * Usage: node scripts/migrate-csv.js
 * Output: migrations/003_import_bookings.sql
 */

const fs = require('fs');
const path = require('path');

// CSV file to accommodation_id mapping
const CSV_FILES = [
  { file: 'Gestao de reservas_Esperanca Terrace(Reservas).csv', accommodationId: 1, name: 'Esperança Terrace' },
  { file: 'Gestao de reservas_Villa Natura(Reservas).csv', accommodationId: 2, name: 'Nattura Gerês Village' },
  { file: 'Gestao de reservas_Douro and Sabor(Reservas).csv', accommodationId: 3, name: 'Douro & Sabor Escape' }
];

// Month name to number mapping (Portuguese and English)
const MONTHS = {
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
  'feb': '02', 'apr': '04', 'may': '05', 'aug': '08', 'sep': '09', 'oct': '10', 'dec': '12'
};

// Language to nationality mapping
const NATIONALITY_MAP = {
  'portugues': 'PT', 'português': 'PT', 'portgues': 'PT', 'portguês': 'PT',
  'frances': 'FR', 'francês': 'FR', 'français': 'FR',
  'ingles': 'EN', 'inglês': 'EN', 'ingl~es': 'EN', 'inglês/frances': 'EN',
  'espanhol': 'ES',
  'brazileiro': 'BR', 'brasileiro': 'BR',
  'italiano': 'IT',
  'americano': 'US',
  'francês/belga': 'BE', 'francês/inglês': 'FR'
};

/**
 * Parse date from DD-Mon-YY format to YYYY-MM-DD
 * Example: "11-Jan-25" -> "2025-01-11"
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  
  const day = parts[0].padStart(2, '0');
  const monthName = parts[1].toLowerCase().substring(0, 3);
  const year = parts[2];
  
  const month = MONTHS[monthName];
  if (!month) {
    console.warn(`Unknown month: ${monthName} in date: ${dateStr}`);
    return null;
  }
  
  // Assume 20XX for years
  const fullYear = year.length === 2 ? `20${year}` : year;
  
  return `${fullYear}-${month}-${day}`;
}

/**
 * Parse guest field to extract name and count
 * Examples:
 * "Patricia Soares e mais 7 adultos" -> { name: "Patricia Soares", guests: 8 }
 * "Katia Balane e mais 4 adultos e uma criança (10 anos)" -> { name: "Katia Balane", guests: 6 }
 * "Rita + 5 hospedes" -> { name: "Rita", guests: 6 }
 */
function parseGuests(guestStr) {
  if (!guestStr || guestStr.trim() === '') {
    return { name: 'Desconhecido', guests: 1 };
  }
  
  let name = guestStr.trim();
  let additionalGuests = 0;
  
  // Pattern: "Name e mais X adultos" or "Name e mais X pessoas"
  const patternEMais = /^(.+?)\s+e\s+mais\s+(\d+)/i;
  const matchEMais = name.match(patternEMais);
  if (matchEMais) {
    name = matchEMais[1].trim();
    additionalGuests = parseInt(matchEMais[2]) || 0;
  }
  
  // Pattern: "Name + X hóspedes" or "Name + X adultos"
  const patternPlus = /^(.+?)\s*\+\s*(\d+)\s*(hóspedes?|adultos?|pessoas?)/i;
  const matchPlus = name.match(patternPlus);
  if (matchPlus) {
    name = matchPlus[1].trim();
    additionalGuests = parseInt(matchPlus[2]) || 0;
  }
  
  // Pattern: "Name e mais um" or "Name + Adulto"
  const patternOne = /^(.+?)\s+(e\s+mais\s+um|e\s+outro|\+\s*adulto|\+\s*1\s*adulto)/i;
  const matchOne = name.match(patternOne);
  if (matchOne) {
    name = matchOne[1].trim();
    additionalGuests = 1;
  }
  
  // Count additional mentions of children/adults in full string
  const childrenMatch = guestStr.match(/(\d+)\s*(criança|crian[çc]as?|bebe|bebé)/gi);
  if (childrenMatch) {
    childrenMatch.forEach(m => {
      const num = parseInt(m.match(/\d+/)?.[0] || '1');
      additionalGuests += num;
    });
  }
  
  // Clean up name - remove trailing descriptions
  name = name.replace(/\s*(e\s+mais.*|mais\s+\d+.*|\+.*|\(\d+.*)/i, '').trim();
  
  // Total guests = primary + additional
  const totalGuests = Math.max(1, 1 + additionalGuests);
  
  return { name, guests: Math.min(totalGuests, 20) }; // Cap at 20
}

/**
 * Parse monetary value from "€ 130,00" format to float
 */
function parseValue(valueStr) {
  if (!valueStr || valueStr.trim() === '' || valueStr.trim() === '-') return 0;
  
  // Remove currency symbol and spaces
  let clean = valueStr.replace(/[€\s]/g, '').trim();
  
  // Handle European format: 1.234,56 -> 1234.56
  // First remove thousands separator (.)
  clean = clean.replace(/\./g, '');
  // Then convert decimal separator (,) to (.)
  clean = clean.replace(',', '.');
  
  const value = parseFloat(clean);
  return isNaN(value) ? 0 : Math.round(value * 100) / 100;
}

/**
 * Map language to nationality code
 */
function mapNationality(language) {
  if (!language) return 'OTHER';
  const key = language.toLowerCase().trim();
  return NATIONALITY_MAP[key] || 'OTHER';
}

/**
 * Escape single quotes for SQL
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Parse a single CSV line (handling quoted fields)
 */
function parseCSVLine(line, delimiter = ';') {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  
  return fields;
}

/**
 * Check if a booking overlaps with existing bookings
 */
function hasOverlap(booking, existingBookings) {
  return existingBookings.some(existing => {
    if (existing.accommodationId !== booking.accommodationId) return false;
    if (existing.status === 'cancelled') return false;
    
    // Check date overlap: A.start < B.end AND A.end > B.start
    return existing.checkIn < booking.checkOut && existing.checkOut > booking.checkIn;
  });
}

/**
 * Main migration function
 */
function migrate() {
  const allBookings = [];
  const errors = [];
  
  for (const csvConfig of CSV_FILES) {
    const filePath = path.join(process.cwd(), csvConfig.file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${csvConfig.file}`);
      continue;
    }
    
    console.log(`\nProcessing: ${csvConfig.file} -> Accommodation ID ${csvConfig.accommodationId}`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip header line
    let lineNum = 0;
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const line of lines) {
      lineNum++;
      
      if (lineNum === 1) continue; // Skip header
      if (!line.trim()) continue; // Skip empty lines
      
      const fields = parseCSVLine(line);
      
      // Expected columns: Mes;Data Check-In;Data check-out;Noites;Guest;Lingua;Motivo viagem;Valor;Imposto Municipal;Comissao;Taxa bancaria;Valor sem comissoes;Valor Sem IVA;IVA (6%);Plataforma
      if (fields.length < 15) {
        // Skip summary/empty rows
        continue;
      }
      
      const [
        mes, dataCheckIn, dataCheckOut, noites, guest, lingua, motivoViagem,
        valor, impostoMunicipal, comissao, taxaBancaria, valorSemComissoes,
        valorSemIva, iva, plataforma
      ] = fields;
      
      // Skip rows without valid dates
      const checkIn = parseDate(dataCheckIn);
      const checkOut = parseDate(dataCheckOut);
      
      if (!checkIn || !checkOut) {
        continue;
      }
      
      // Check for cancellation (Villa Natura has "Observações" column)
      if (fields.length > 18) {
        const observacoes = fields[18] || '';
        if (observacoes.toLowerCase().includes('cancelada')) {
          skippedCount++;
          continue;
        }
      }
      
      // Parse guest info
      const { name: primaryName, guests: guestCount } = parseGuests(guest);
      
      // Build booking object
      const booking = {
        accommodationId: csvConfig.accommodationId,
        checkIn,
        checkOut,
        guests: guestCount,
        nationality: mapNationality(lingua),
        primaryName,
        additionalNames: '',
        notes: motivoViagem ? `${motivoViagem}` : '',
        status: 'confirmed',
        valor: parseValue(valor),
        impostoMunicipal: parseValue(impostoMunicipal),
        comissao: parseValue(comissao),
        taxaBancaria: parseValue(taxaBancaria),
        valorSemComissoes: parseValue(valorSemComissoes),
        valorSemIva: parseValue(valorSemIva),
        iva: parseValue(iva),
        plataforma: (plataforma || '').trim()
      };
      
      // Check for overlaps within same accommodation
      if (hasOverlap(booking, allBookings)) {
        errors.push(`Line ${lineNum} (${csvConfig.name}): Overlap detected for ${primaryName} ${checkIn} - ${checkOut}`);
        skippedCount++;
        continue;
      }
      
      allBookings.push(booking);
      processedCount++;
    }
    
    console.log(`  Processed: ${processedCount}, Skipped: ${skippedCount}`);
  }
  
  // Generate SQL
  console.log(`\n=== Generating SQL ===`);
  console.log(`Total bookings to import: ${allBookings.length}`);
  
  if (errors.length > 0) {
    console.log(`\nWarnings/Errors:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  // Sort by check_in date
  allBookings.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  
  // Generate SQL file
  let sql = `-- Auto-generated migration: Import bookings from CSV
-- Generated at: ${new Date().toISOString()}
-- Total records: ${allBookings.length}
-- Run with: npx wrangler d1 execute method-passion-db --remote --file=./migrations/003_import_bookings.sql

`;
  
  for (const booking of allBookings) {
    sql += `INSERT INTO bookings (accommodation_id, check_in, check_out, guests, nationality, primary_name, additional_names, notes, status, valor, imposto_municipal, comissao, taxa_bancaria, valor_sem_comissoes, valor_sem_iva, iva, plataforma) VALUES (${booking.accommodationId}, '${booking.checkIn}', '${booking.checkOut}', ${booking.guests}, '${escapeSql(booking.nationality)}', '${escapeSql(booking.primaryName)}', '${escapeSql(booking.additionalNames)}', '${escapeSql(booking.notes)}', '${booking.status}', ${booking.valor}, ${booking.impostoMunicipal}, ${booking.comissao}, ${booking.taxaBancaria}, ${booking.valorSemComissoes}, ${booking.valorSemIva}, ${booking.iva}, '${escapeSql(booking.plataforma)}');\n`;
  }
  
  // Write SQL file
  const outputPath = path.join(process.cwd(), 'migrations', '003_import_bookings.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`\nSQL file written to: ${outputPath}`);
  console.log(`\nTo run the migration:`);
  console.log(`  npx wrangler d1 execute method-passion-db --remote --file=./migrations/003_import_bookings.sql`);
}

// Run migration
migrate();
