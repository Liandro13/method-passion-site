// Delete blocked date endpoint
import { requireAdmin } from '../_clerkAuth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// DELETE - Delete blocked date
export async function onRequestDelete(context) {
  try {
    const user = await requireAdmin(context);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const id = context.params.id;
    await context.env.DB.prepare('DELETE FROM blocked_dates WHERE id = ?')
      .bind(parseInt(id))
      .run();

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
