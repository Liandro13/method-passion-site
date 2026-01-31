// Team bookings endpoint - returns confirmed bookings for allowed accommodations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

export async function onRequestGet(context) {
  try {
    // Get token from cookie
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('=').map(s => s.trim()))
    );
    const token = cookies['team_session'];

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Check session and get user
    const session = await context.env.DB.prepare(`
      SELECT ts.*, tu.allowed_accommodations 
      FROM team_sessions ts
      JOIN team_users tu ON ts.team_user_id = tu.id
      WHERE ts.token = ? AND ts.expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const allowedAccommodations = JSON.parse(session.allowed_accommodations || '[]');

    if (allowedAccommodations.length === 0) {
      return new Response(JSON.stringify({ bookings: [] }), { 
        headers: corsHeaders 
      });
    }

    // Get confirmed bookings for allowed accommodations
    const placeholders = allowedAccommodations.map(() => '?').join(',');
    const result = await context.env.DB.prepare(`
      SELECT b.*, a.name as accommodation_name 
      FROM bookings b
      JOIN accommodations a ON b.accommodation_id = a.id
      WHERE b.status = 'confirmed' 
      AND b.accommodation_id IN (${placeholders})
      AND b.check_out >= date('now')
      ORDER BY b.check_in ASC
    `).bind(...allowedAccommodations).all();

    return new Response(JSON.stringify({ bookings: result.results }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
