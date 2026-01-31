// Team session check endpoint
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
      return new Response(JSON.stringify({ authenticated: false }), { 
        headers: corsHeaders 
      });
    }

    // Check session
    const session = await context.env.DB.prepare(`
      SELECT ts.*, tu.name, tu.allowed_accommodations 
      FROM team_sessions ts
      JOIN team_users tu ON ts.team_user_id = tu.id
      WHERE ts.token = ? AND ts.expires_at > datetime('now')
    `).bind(token).first();

    if (!session) {
      return new Response(JSON.stringify({ authenticated: false }), { 
        headers: corsHeaders 
      });
    }

    return new Response(JSON.stringify({ 
      authenticated: true,
      user: {
        id: session.team_user_id,
        name: session.name,
        allowed_accommodations: JSON.parse(session.allowed_accommodations || '[]')
      }
    }), { 
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
