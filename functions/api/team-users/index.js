// Team users CRUD endpoint (admin only)
import { verifySession } from '../_auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Simple hash function for passwords (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET - List team users
export async function onRequestGet(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const result = await context.env.DB.prepare(`
      SELECT id, username, name, allowed_accommodations, created_at 
      FROM team_users 
      ORDER BY name
    `).all();

    return new Response(JSON.stringify({ users: result.results }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// POST - Create team user
export async function onRequestPost(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const { username, password, name, allowed_accommodations } = await context.request.json();

    if (!username || !password || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Check if username already exists
    const existing = await context.env.DB.prepare(
      'SELECT id FROM team_users WHERE username = ?'
    ).bind(username).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), { 
        status: 409, 
        headers: corsHeaders 
      });
    }

    const passwordHash = await hashPassword(password);
    const accommodations = JSON.stringify(allowed_accommodations || []);

    const result = await context.env.DB.prepare(`
      INSERT INTO team_users (username, password_hash, name, allowed_accommodations)
      VALUES (?, ?, ?, ?)
    `).bind(username, passwordHash, name, accommodations).run();

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
