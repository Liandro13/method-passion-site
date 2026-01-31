// Single booking CRUD endpoint (GET, PUT, DELETE)
import { verifySession } from '../_auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// GET - Get single booking
export async function onRequestGet(context) {
  try {
    const isAuth = await verifySession(context);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const id = context.params.id;
    const result = await context.env.DB.prepare(
      'SELECT * FROM bookings WHERE id = ?'
    ).bind(parseInt(id)).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    return new Response(JSON.stringify({ booking: result }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// PUT - Update booking
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
    const { 
      check_in, check_out, guests, nationality, primary_name, additional_names, notes, status,
      // Financial fields
      valor, imposto_municipal, comissao, taxa_bancaria, valor_sem_comissoes, valor_sem_iva, iva, plataforma
    } = data;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (check_in) { updates.push('check_in = ?'); values.push(check_in); }
    if (check_out) { updates.push('check_out = ?'); values.push(check_out); }
    if (guests !== undefined) { updates.push('guests = ?'); values.push(guests); }
    if (nationality !== undefined) { updates.push('nationality = ?'); values.push(nationality); }
    if (primary_name) { updates.push('primary_name = ?'); values.push(primary_name); }
    if (additional_names !== undefined) { updates.push('additional_names = ?'); values.push(additional_names); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (status) { updates.push('status = ?'); values.push(status); }
    
    // Financial fields
    if (valor !== undefined) { updates.push('valor = ?'); values.push(valor); }
    if (imposto_municipal !== undefined) { updates.push('imposto_municipal = ?'); values.push(imposto_municipal); }
    if (comissao !== undefined) { updates.push('comissao = ?'); values.push(comissao); }
    if (taxa_bancaria !== undefined) { updates.push('taxa_bancaria = ?'); values.push(taxa_bancaria); }
    if (valor_sem_comissoes !== undefined) { updates.push('valor_sem_comissoes = ?'); values.push(valor_sem_comissoes); }
    if (valor_sem_iva !== undefined) { updates.push('valor_sem_iva = ?'); values.push(valor_sem_iva); }
    if (iva !== undefined) { updates.push('iva = ?'); values.push(iva); }
    if (plataforma !== undefined) { updates.push('plataforma = ?'); values.push(plataforma); }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(parseInt(id));

    await context.env.DB.prepare(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

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

// DELETE - Delete booking
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
    await context.env.DB.prepare('DELETE FROM bookings WHERE id = ?')
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
