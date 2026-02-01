// Images API endpoint - upload, delete, reorder accommodation images
// Uses Cloudflare R2 for storage with automatic image optimization

import { verifyClerkToken } from './_clerkAuth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

// GET - List images for an accommodation
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const accommodationId = url.searchParams.get('accommodation_id');

  try {
    let query = 'SELECT * FROM accommodation_images';
    const params = [];

    if (accommodationId) {
      query += ' WHERE accommodation_id = ?';
      params.push(accommodationId);
    }

    query += ' ORDER BY accommodation_id, display_order';

    const result = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      images: result.results
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

// POST - Upload new image
export async function onRequestPost(context) {
  const { env, request } = context;

  // Verify admin
  const auth = await requireAdmin(request, env);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: corsHeaders
    });
  }

  // Check if R2 is configured
  if (!env.IMAGES) {
    return new Response(JSON.stringify({
      error: 'Image storage (R2) is not configured. Please enable R2 in Cloudflare Dashboard and uncomment the r2_buckets section in wrangler.toml'
    }), { status: 503, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const accommodationId = formData.get('accommodation_id');
    const caption = formData.get('caption') || '';

    if (!file || !accommodationId) {
      return new Response(JSON.stringify({
        error: 'File and accommodation_id are required'
      }), { status: 400, headers: corsHeaders });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `accommodations/${accommodationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await env.IMAGES.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/jpeg'
      }
    });

    // Get current max display_order for this accommodation
    const orderResult = await env.DB.prepare(
      'SELECT MAX(display_order) as max_order FROM accommodation_images WHERE accommodation_id = ?'
    ).bind(accommodationId).first();
    
    const nextOrder = (orderResult?.max_order || 0) + 1;

    // Check if this is the first image (make it primary)
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM accommodation_images WHERE accommodation_id = ?'
    ).bind(accommodationId).first();
    
    const isPrimary = countResult?.count === 0;

    // The image URL will be served from R2 public access or via a worker
    const imageUrl = `/api/images/file/${filename}`;

    // Insert into database
    const result = await env.DB.prepare(`
      INSERT INTO accommodation_images (accommodation_id, image_url, display_order, caption, is_primary)
      VALUES (?, ?, ?, ?, ?)
    `).bind(accommodationId, imageUrl, nextOrder, caption, isPrimary ? 1 : 0).run();

    return new Response(JSON.stringify({
      success: true,
      image: {
        id: result.meta.last_row_id,
        accommodation_id: parseInt(accommodationId),
        image_url: imageUrl,
        display_order: nextOrder,
        caption,
        is_primary: isPrimary
      }
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

// PUT - Update image (reorder, caption, primary status)
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
    const { id, display_order, caption, is_primary, reorder } = data;

    // Bulk reorder operation
    if (reorder && Array.isArray(reorder)) {
      const statements = reorder.map((item, index) => 
        env.DB.prepare('UPDATE accommodation_images SET display_order = ? WHERE id = ?')
          .bind(index, item.id)
      );
      
      await env.DB.batch(statements);

      return new Response(JSON.stringify({
        success: true,
        message: 'Images reordered'
      }), { headers: corsHeaders });
    }

    // Single image update
    if (!id) {
      return new Response(JSON.stringify({
        error: 'Image id is required'
      }), { status: 400, headers: corsHeaders });
    }

    // If setting as primary, unset others first
    if (is_primary) {
      // Get accommodation_id for this image
      const img = await env.DB.prepare('SELECT accommodation_id FROM accommodation_images WHERE id = ?')
        .bind(id).first();
      
      if (img) {
        await env.DB.prepare('UPDATE accommodation_images SET is_primary = 0 WHERE accommodation_id = ?')
          .bind(img.accommodation_id).run();
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (caption !== undefined) {
      updates.push('caption = ?');
      values.push(caption);
    }
    if (is_primary !== undefined) {
      updates.push('is_primary = ?');
      values.push(is_primary ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        error: 'No fields to update'
      }), { status: 400, headers: corsHeaders });
    }

    values.push(id);
    await env.DB.prepare(`UPDATE accommodation_images SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values).run();

    return new Response(JSON.stringify({
      success: true
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

// DELETE - Remove image
export async function onRequestDelete(context) {
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
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Image id is required'
      }), { status: 400, headers: corsHeaders });
    }

    // Get image details first
    const image = await env.DB.prepare('SELECT * FROM accommodation_images WHERE id = ?')
      .bind(id).first();

    if (!image) {
      return new Response(JSON.stringify({
        error: 'Image not found'
      }), { status: 404, headers: corsHeaders });
    }

    // Delete from R2 if it's an R2 URL and R2 is configured
    if (image.image_url.startsWith('/api/images/file/') && env.IMAGES) {
      const r2Key = image.image_url.replace('/api/images/file/', '');
      try {
        await env.IMAGES.delete(r2Key);
      } catch (e) {
        console.error('R2 delete error:', e);
        // Continue even if R2 delete fails
      }
    }

    // Delete from database
    await env.DB.prepare('DELETE FROM accommodation_images WHERE id = ?').bind(id).run();

    // If this was primary, make the first remaining image primary
    if (image.is_primary) {
      const firstImage = await env.DB.prepare(
        'SELECT id FROM accommodation_images WHERE accommodation_id = ? ORDER BY display_order LIMIT 1'
      ).bind(image.accommodation_id).first();

      if (firstImage) {
        await env.DB.prepare('UPDATE accommodation_images SET is_primary = 1 WHERE id = ?')
          .bind(firstImage.id).run();
      }
    }

    return new Response(JSON.stringify({
      success: true
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
