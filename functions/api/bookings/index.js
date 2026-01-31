// Bookings CRUD endpoint
import { verifySession } from './_auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// GET - List bookings
export async function onRequestGet(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const url = new URL(context.request.url);
    const accommodationId = url.searchParams.get('accommodation_id');

    let query = `
      SELECT b.*, a.name as accommodation_name 
      FROM bookings b 
      JOIN accommodations a ON b.accommodation_id = a.id
    `;
    
    if (accommodationId) {
      query += ` WHERE b.accommodation_id = ?`;
      const result = await context.env.DB.prepare(query)
        .bind(parseInt(accommodationId))
        .all();
      return new Response(JSON.stringify({ bookings: result.results }), { 
        headers: corsHeaders 
      });
    }

    query += ` ORDER BY b.check_in DESC`;
    const result = await context.env.DB.prepare(query).all();
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

// POST - Create booking
export async function onRequestPost(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const data = await context.request.json();
    const { accommodation_id, check_in, check_out, guests, nationality, primary_name, additional_names, notes } = data;

    // Validate required fields
    if (!accommodation_id || !check_in || !check_out || !guests || !primary_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Check for date conflicts
    const conflicts = await context.env.DB.prepare(`
      SELECT id FROM bookings 
      WHERE accommodation_id = ? 
      AND check_in < ? AND check_out > ?
    `).bind(accommodation_id, check_out, check_in).all();

    if (conflicts.results.length > 0) {
      return new Response(JSON.stringify({ error: 'Date conflict with existing booking' }), { 
        status: 409, 
        headers: corsHeaders 
      });
    }

    // Insert booking
    const result = await context.env.DB.prepare(`
      INSERT INTO bookings (accommodation_id, check_in, check_out, guests, nationality, primary_name, additional_names, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      accommodation_id, 
      check_in, 
      check_out, 
      guests, 
      nationality || '', 
      primary_name, 
      additional_names || '', 
      notes || ''
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id 
    }), { 
      status: 201, 
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
