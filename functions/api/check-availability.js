// Cloudflare Pages Function - Check Availability from Excel
// Reads Excel files from OneDrive using public share links

// Public OneDrive share links for each accommodation
const EXCEL_FILES = {
  'Esperança Terrace': {
    shareUrl: 'https://1drv.ms/x/c/9a22752e1635a56d/IQCQ9vEvuXP6SLqzXfazBqDiAbyqsGohQUeZsIrkKeevNYY?e=cPQzsb'
  },
  'Douro & Sabor Escape': {
    shareUrl: '' // TODO: Add share link
  },
  'Nattura Gerês Village': {
    shareUrl: '' // TODO: Add share link
  }
};

// Convert OneDrive share URL to API endpoint
function getShareToken(shareUrl) {
  // Encode the URL in base64 (URL-safe, unpadded)
  const base64 = btoa(shareUrl)
    .replace(/=+$/, '') // Remove padding
    .replace(/\+/g, '-') // Replace + with -
    .replace(/\//g, '_'); // Replace / with _
  return `u!${base64}`;
}

// Read Excel file from public share link
async function getBookedDates(shareUrl, debugInfo = { logs: [] }) {
  try {
    const shareToken = getShareToken(shareUrl);
    const url = `https://graph.microsoft.com/v1.0/shares/${shareToken}/driveItem/workbook/worksheets/reservas/usedRange`;
    
    debugInfo.logs.push(`Share token: ${shareToken}`);
    debugInfo.logs.push(`Fetching: ${url}`);
  
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  if (!response.ok) {
    const errorText = await response.text();
    debugInfo.logs.push(`Error response: ${response.status} - ${errorText}`);
    console.error('Failed to read Excel:', errorText);
    return [];
  }

  const data = await response.json();
  const rows = data.values;

  // Parse dates from Excel
  // Estrutura: Coluna A (Mês), B (Data Check-In), C (Data check-out), D (Noites), E (Guest), F (Lingua)
  const bookedDates = [];
  
  debugInfo.logs.push(`Excel rows: ${rows.length}`);
  debugInfo.logs.push(`First 3 rows: ${JSON.stringify(rows.slice(0, 3))}`);
  
  for (let i = 1; i < rows.length; i++) { // Skip header row
    const checkIn = rows[i][1];  // Coluna B (Data Check-In)
    const checkOut = rows[i][2]; // Coluna C (Data check-out)

    if (i < 5) { // Log first 5 rows for debugging
      debugInfo.logs.push(`Row ${i}: checkIn=${checkIn}, checkOut=${checkOut}`);
    }

    // Only process if both dates exist and are not empty strings
    if (checkIn && checkOut && checkIn.toString().trim() !== '' && checkOut.toString().trim() !== '') {
      const parsedCheckIn = parseExcelDate(checkIn);
      const parsedCheckOut = parseExcelDate(checkOut);
      
      if (i < 5) {
        debugInfo.logs.push(`Parsed: ${parsedCheckIn} to ${parsedCheckOut}`);
      }
      
      if (parsedCheckIn && parsedCheckOut) {
        bookedDates.push({
          checkIn: parsedCheckIn,
          checkOut: parsedCheckOut
        });
      }
    }
  }

  debugInfo.logs.push(`Total booked dates found: ${bookedDates.length}`);
  return bookedDates;
  } catch (error) {
    debugInfo.logs.push(`Error: ${error.message}`);
    return [];
  }
}

// Parse Excel date (can be string, Excel serial number, or date object)
function parseExcelDate(value) {
  if (!value) return null;
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel serial date (days since 1900-01-01)
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // If it's a string
  if (typeof value === 'string') {
    // Try format: dd-mmm-yy (e.g., "03-Jan-26")
    const ddMmmYyMatch = value.match(/(\d{1,2})-(\w{3})-(\d{2})/);
    if (ddMmmYyMatch) {
      const day = ddMmmYyMatch[1].padStart(2, '0');
      const monthStr = ddMmmYyMatch[2].toLowerCase();
      const year = '20' + ddMmmYyMatch[3]; // Assume 20xx
      
      const months = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      
      const month = months[monthStr];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    
    // Try standard date parsing
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// Check if dates overlap with existing bookings
function checkAvailability(requestedCheckIn, requestedCheckOut, bookedDates) {
  const reqIn = new Date(requestedCheckIn);
  const reqOut = new Date(requestedCheckOut);

  for (const booking of bookedDates) {
    const bookIn = new Date(booking.checkIn);
    const bookOut = new Date(booking.checkOut);

    // Check for overlap
    if (reqIn < bookOut && reqOut > bookIn) {
      return {
        available: false,
        conflict: booking
      };
    }
  }

  return { available: true };
}

// Main handler
export async function onRequest(context) {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { accommodation, checkIn, checkOut } = await context.request.json();

    // Validate input
    if (!accommodation || !checkIn || !checkOut) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: accommodation, checkIn, checkOut'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get Excel file info
    const excelFile = EXCEL_FILES[accommodation];
    if (!excelFile || !excelFile.shareUrl) {
      return new Response(JSON.stringify({
        error: 'Invalid accommodation or share link not configured'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get booked dates from Excel using public share link
    const debugInfo = { logs: [] };
    const bookedDates = await getBookedDates(excelFile.shareUrl, debugInfo);

    // Check availability
    const result = checkAvailability(checkIn, checkOut, bookedDates);

    return new Response(JSON.stringify({
      accommodation,
      checkIn,
      checkOut,
      ...result,
      bookedDates: bookedDates.map(d => ({ checkIn: d.checkIn, checkOut: d.checkOut })),
      debug: debugInfo.logs // Return debug info
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
