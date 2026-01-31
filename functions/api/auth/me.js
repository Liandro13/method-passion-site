// Check auth status endpoint

export async function onRequestGet(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  try {
    // Get session from cookie
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const token = sessionMatch ? sessionMatch[1] : null;

    if (!token) {
      return new Response(JSON.stringify({ authenticated: false }), { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Check if session exists and is not expired
    const result = await context.env.DB.prepare(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();

    return new Response(JSON.stringify({ 
      authenticated: !!result 
    }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ authenticated: false }), { 
      status: 200, 
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
