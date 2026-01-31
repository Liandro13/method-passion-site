// Single team user endpoint (PUT, DELETE)
import { verifySession } from '../_auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

// PUT - Update team user
export async function onRequestPut(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const id = context.params.id;
    const data = await context.request.json();
    const { name, password, allowed_accommodations } = data;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (password) {
      updates.push('password_hash = ?');
      values.push(await hashPassword(password));
    }

    if (allowed_accommodations !== undefined) {
      updates.push('allowed_accommodations = ?');
      values.push(JSON.stringify(allowed_accommodations));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    values.push(id);

    await context.env.DB.prepare(`
      UPDATE team_users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// DELETE - Remove team user
export async function onRequestDelete(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const id = context.params.id;

    // Delete associated sessions first
    await context.env.DB.prepare('DELETE FROM team_sessions WHERE team_user_id = ?').bind(id).run();
    
    // Delete user
    await context.env.DB.prepare('DELETE FROM team_users WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { 
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
