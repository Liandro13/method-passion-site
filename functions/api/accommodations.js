// Accommodations endpoint (public GET, admin PUT)

import { verifyClerkToken } from './_clerkAuth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Verify admin authentication
async function requireAdmin(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = await verifyClerkToken(token, env);
  
  if (!payload) {
    return { error: 'Invalid token', status: 401 };
  }

  const role = payload.publicMetadata?.role || payload.public_metadata?.role;
  if (role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { payload };
}

export async function onRequestGet(context) {
  try {
    // Get accommodations
    const accommodationsResult = await context.env.DB.prepare(
      'SELECT * FROM accommodations ORDER BY id'
    ).all();

    // Get all images
    const imagesResult = await context.env.DB.prepare(
      'SELECT * FROM accommodation_images ORDER BY accommodation_id, display_order'
    ).all();

    // Group images by accommodation
    const imagesByAccommodation = {};
    for (const img of imagesResult.results) {
      if (!imagesByAccommodation[img.accommodation_id]) {
        imagesByAccommodation[img.accommodation_id] = [];
      }
      imagesByAccommodation[img.accommodation_id].push({
        ...img,
        is_primary: Boolean(img.is_primary)
      });
    }

    // Attach images to accommodations
    const accommodations = accommodationsResult.results.map(acc => {
      const images = imagesByAccommodation[acc.id] || [];
      const primaryImage = images.find(img => img.is_primary) || images[0];
      
      return {
        ...acc,
        images,
        primary_image: primaryImage?.image_url || acc.image_url
      };
    });

    return new Response(JSON.stringify({ 
      accommodations 
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

export async function onRequestPut(context) {
  const { env, request } = context;

  // Verify admin
  const auth = await requireAdmin(request, env);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: corsHeaders
    });
  }

  try {
    const data = await request.json();
    const { id, description_pt, description_en, description_fr, description_de, description_es, max_guests, name, amenities } = data;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Accommodation id is required'
      }), { status: 400, headers: corsHeaders });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description_pt !== undefined) {
      updates.push('description_pt = ?');
      values.push(description_pt);
    }
    if (description_en !== undefined) {
      updates.push('description_en = ?');
      values.push(description_en);
    }
    if (description_fr !== undefined) {
      updates.push('description_fr = ?');
      values.push(description_fr);
    }
    if (description_de !== undefined) {
      updates.push('description_de = ?');
      values.push(description_de);
    }
    if (description_es !== undefined) {
      updates.push('description_es = ?');
      values.push(description_es);
    }
    if (max_guests !== undefined) {
      updates.push('max_guests = ?');
      values.push(max_guests);
    }
    if (amenities !== undefined) {
      updates.push('amenities = ?');
      values.push(JSON.stringify(amenities));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        error: 'No fields to update'
      }), { status: 400, headers: corsHeaders });
    }

    values.push(id);
    await env.DB.prepare(`UPDATE accommodations SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values).run();

    // Get updated accommodation with images
    const acc = await env.DB.prepare('SELECT * FROM accommodations WHERE id = ?').bind(id).first();
    const imagesResult = await env.DB.prepare(
      'SELECT * FROM accommodation_images WHERE accommodation_id = ? ORDER BY display_order'
    ).bind(id).all();

    const images = imagesResult.results.map(img => ({
      ...img,
      is_primary: Boolean(img.is_primary)
    }));
    const primaryImage = images.find(img => img.is_primary) || images[0];

    return new Response(JSON.stringify({
      success: true,
      accommodation: {
        ...acc,
        images,
        primary_image: primaryImage?.image_url || acc.image_url
      }
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
