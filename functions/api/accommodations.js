// Accommodations endpoint (public)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestGet(context) {
  try {
    const result = await context.env.DB.prepare(
      'SELECT * FROM accommodations ORDER BY id'
    ).all();

    return new Response(JSON.stringify({ 
      accommodations: result.results 
    }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
