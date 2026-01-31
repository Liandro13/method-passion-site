// Team logout endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

export async function onRequestPost(context) {
  try {
    // Get token from cookie
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('=').map(s => s.trim()))
    );
    const token = cookies['team_session'];

    if (token) {
      await context.env.DB.prepare('DELETE FROM team_sessions WHERE token = ?').bind(token).run();
    }

    const response = new Response(JSON.stringify({ success: true }), { 
      headers: corsHeaders 
    });

    // Clear cookie
    response.headers.set('Set-Cookie', 
      'team_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
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
