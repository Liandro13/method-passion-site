// Cloudflare Pages Function - Check Availability from Excel
// Reads Excel files from OneDrive using Microsoft Graph API

// Excel file IDs for each accommodation
const EXCEL_FILES = {
  'Esperança Terrace': {
    driveId: '9A22752E1635A56D',
    itemId: '9A22752E1635A56D!s2ff1f69073b948fabab35df6b306a0e2'
  },
  'Douro & Sabor Escape': {
    driveId: '9A22752E1635A56D',
    itemId: '9A22752E1635A56D!sf55321e4034a4ecebf03bbdcba581719'
  },
  'Nattura Gerês Village': {
    driveId: '9A22752E1635A56D',
    itemId: '9A22752E1635A56D!s15f4a7efc4df4065ac43da709c44965d'
  }
};

// Microsoft Graph API authentication
async function getAccessToken(env) {
  const tokenUrl = `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Read Excel file and extract booked dates
async function getBookedDates(accessToken, driveId, itemId) {
  // Get worksheet data
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/worksheets/Sheet1/usedRange`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('Failed to read Excel:', await response.text());
    return [];
  }

  const data = await response.json();
  const rows = data.values;

  // Parse dates from Excel
  // Estrutura: Coluna A (Mês), B (Data Check-In), C (Data check-out), D (Noites), E (Guest), F (Lingua)
  const bookedDates = [];
  
  for (let i = 1; i < rows.length; i++) { // Skip header row
    const checkIn = rows[i][1];  // Coluna B (Data Check-In)
    const checkOut = rows[i][2]; // Coluna C (Data check-out)

    // Only process if both dates exist
    if (checkIn && checkOut) {
      const parsedCheckIn = parseExcelDate(checkIn);
      const parsedCheckOut = parseExcelDate(checkOut);
      
      if (parsedCheckIn && parsedCheckOut) {
        bookedDates.push({
          checkIn: parsedCheckIn,
          checkOut: parsedCheckOut
        });
      }
    }
  }

  return bookedDates;
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
    if (!excelFile) {
      return new Response(JSON.stringify({
        error: 'Invalid accommodation name'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get access token
    const accessToken = await getAccessToken(context.env);

    // Get booked dates from Excel
    const bookedDates = await getBookedDates(accessToken, excelFile.driveId, excelFile.itemId);

    // Check availability
    const result = checkAvailability(checkIn, checkOut, bookedDates);

    return new Response(JSON.stringify({
      accommodation,
      checkIn,
      checkOut,
      ...result,
      bookedDates: bookedDates.map(d => ({ checkIn: d.checkIn, checkOut: d.checkOut }))
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
