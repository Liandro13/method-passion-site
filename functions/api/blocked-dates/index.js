// Blocked dates CRUD endpoint
import { verifySession } from '../_auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// GET - List blocked dates
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

    let query = 'SELECT * FROM blocked_dates';
    
    if (accommodationId) {
      query += ' WHERE accommodation_id = ?';
      const result = await context.env.DB.prepare(query)
        .bind(parseInt(accommodationId))
        .all();
      return new Response(JSON.stringify({ blockedDates: result.results }), { 
        headers: corsHeaders 
      });
    }

    const result = await context.env.DB.prepare(query).all();
    return new Response(JSON.stringify({ blockedDates: result.results }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// POST - Create blocked date
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
    const { accommodation_id, start_date, end_date, reason } = data;

    // Validate required fields
    if (!accommodation_id || !start_date || !end_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Insert blocked date
    const result = await context.env.DB.prepare(`
      INSERT INTO blocked_dates (accommodation_id, start_date, end_date, reason)
      VALUES (?, ?, ?, ?)
    `).bind(accommodation_id, start_date, end_date, reason || '').run();

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
