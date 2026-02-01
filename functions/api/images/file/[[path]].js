// Serve images from R2 bucket
// Route: /api/images/file/[...path]

export async function onRequestGet(context) {
  const { env, params } = context;
  
  // Get the file path from the catch-all param
  // In Cloudflare Pages, [[path]] returns an array of path segments
  let filePath = params.path;
  
  // If it's an array, join it with /
  if (Array.isArray(filePath)) {
    filePath = filePath.join('/');
  }
  
  if (!filePath) {
    return new Response('File path required', { status: 400 });
  }

  // Check if R2 bucket is configured
  if (!env.IMAGES) {
    return new Response('Image storage not configured', { status: 503 });
  }

  try {
    // Get object from R2
    const object = await env.IMAGES.get(filePath);

    if (!object) {
      console.error('Image not found in R2:', filePath);
      return new Response('Image not found: ' + filePath, { status: 404 });
    }

    // Get the image data
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    headers.set('ETag', object.etag);

    return new Response(object.body, { headers });

  } catch (error) {
    console.error('R2 fetch error:', error);
    return new Response('Error fetching image: ' + error.message, { status: 500 });
  }
}
