// Logout endpoint

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Get session from cookie
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const token = sessionMatch ? sessionMatch[1] : null;

    if (token) {
      // Delete session from D1
      await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }

    // Clear cookie
    const cookieOptions = [
      'session=',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=0'
    ].join('; ');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Set-Cookie': cookieOptions
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
