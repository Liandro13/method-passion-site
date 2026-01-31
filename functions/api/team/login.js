// Team login endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// Generate random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const passwordHash = await hashPassword(password);

    // Find user
    const user = await context.env.DB.prepare(`
      SELECT id, name, allowed_accommodations 
      FROM team_users 
      WHERE username = ? AND password_hash = ?
    `).bind(username, passwordHash).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await context.env.DB.prepare(`
      INSERT INTO team_sessions (token, team_user_id, expires_at)
      VALUES (?, ?, ?)
    `).bind(token, user.id, expiresAt).run();

    // Set cookie
    const response = new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        allowed_accommodations: JSON.parse(user.allowed_accommodations || '[]')
      }
    }), { 
      headers: corsHeaders 
    });

    response.headers.set('Set-Cookie', 
      `team_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;

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
