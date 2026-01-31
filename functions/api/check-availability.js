// Check availability endpoint (public)
// Returns booked dates and blocked dates for an accommodation

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Map accommodation names to IDs
const ACCOMMODATION_IDS = {
  'Esperança Terrace': 1,
  'Nattura Gerês Village': 2,
  'Douro & Sabor Escape': 3
};

export async function onRequestPost(context) {
  try {
    const { accommodation, checkIn, checkOut } = await context.request.json();

    // Get accommodation ID
    const accommodationId = ACCOMMODATION_IDS[accommodation];
    if (!accommodationId) {
      return new Response(JSON.stringify({ 
        error: 'Invalid accommodation' 
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get all CONFIRMED bookings for this accommodation
    const bookings = await context.env.DB.prepare(`
      SELECT check_in as checkIn, check_out as checkOut 
      FROM bookings 
      WHERE accommodation_id = ? AND status = 'confirmed'
    `).bind(accommodationId).all();

    // Get all blocked dates for this accommodation
    const blocked = await context.env.DB.prepare(`
      SELECT start_date as checkIn, end_date as checkOut 
      FROM blocked_dates 
      WHERE accommodation_id = ?
    `).bind(accommodationId).all();

    // Combine all unavailable dates
    const bookedDates = [
      ...bookings.results,
      ...blocked.results
    ];

    // Check if requested dates overlap with any booked/blocked dates
    let available = true;
    if (checkIn && checkOut) {
      const reqIn = new Date(checkIn);
      const reqOut = new Date(checkOut);

      for (const range of bookedDates) {
        const bookIn = new Date(range.checkIn);
        const bookOut = new Date(range.checkOut);

        // Check for overlap
        if (reqIn < bookOut && reqOut > bookIn) {
          available = false;
          break;
        }
      }
    }

    return new Response(JSON.stringify({
      accommodation,
      checkIn,
      checkOut,
      available,
      bookedDates
    }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
