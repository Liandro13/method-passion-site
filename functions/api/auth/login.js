// Login endpoint
// Simple auth with hardcoded admin/admin credentials

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  try {
    const { username, password } = await context.request.json();

    // Simple validation - admin/admin
    if (username !== 'admin' || password !== 'admin') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid credentials' 
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Generate session token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Save session to D1
    await context.env.DB.prepare(
      'INSERT INTO sessions (token, expires_at) VALUES (?, ?)'
    ).bind(token, expiresAt).run();

    // Set HTTP-only cookie
    const cookieOptions = [
      `session=${token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${24 * 60 * 60}` // 24 hours
    ].join('; ');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Set-Cookie': cookieOptions
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server error' 
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
