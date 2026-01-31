/**
 * Clerk JWT Verification for Cloudflare Workers
 * 
 * Verifies Clerk session tokens using the JWKS endpoint.
 * No external dependencies required - uses Web Crypto API.
 */

// Admin emails - users with these emails have admin role
const ADMIN_EMAILS = ['liandrodacruz@outlook.pt'];

// Cache for JWKS keys (in-memory, resets on cold start)
let jwksCache = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

/**
 * Fetch and cache JWKS from Clerk
 */
async function getJWKS(clerkDomain) {
  const now = Date.now();
  
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwksCache;
  }

  const response = await fetch(`https://${clerkDomain}/.well-known/jwks.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch JWKS');
  }

  jwksCache = await response.json();
  jwksCacheTime = now;
  return jwksCache;
}

/**
 * Import a JWK as a CryptoKey for verification
 */
async function importJWK(jwk) {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str) {
  // Add padding if needed
  const pad = str.length % 4;
  if (pad) {
    str += '='.repeat(4 - pad);
  }
  // Convert base64url to base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Decode
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verify JWT signature
 */
async function verifyJWT(token, clerkDomain) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  
  // Decode header to get kid
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));
  const kid = header.kid;
  
  if (!kid) {
    throw new Error('No kid in JWT header');
  }

  // Get JWKS and find matching key
  const jwks = await getJWKS(clerkDomain);
  const jwk = jwks.keys.find(k => k.kid === kid);
  
  if (!jwk) {
    // Refresh cache and try again
    jwksCache = null;
    const refreshedJwks = await getJWKS(clerkDomain);
    const refreshedJwk = refreshedJwks.keys.find(k => k.kid === kid);
    if (!refreshedJwk) {
      throw new Error('No matching key found in JWKS');
    }
  }

  // Import key and verify
  const cryptoKey = await importJWK(jwk || jwks.keys.find(k => k.kid === kid));
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signature,
    data
  );

  if (!valid) {
    throw new Error('Invalid JWT signature');
  }

  // Decode and return payload
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  
  // Check expiration
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('JWT expired');
  }

  return payload;
}

/**
 * Extract session token from request
 */
function getSessionToken(request) {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check __session cookie (Clerk's default cookie name)
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/__session=([^;]+)/);
  return sessionMatch ? sessionMatch[1] : null;
}

/**
 * Verify Clerk session and return user info
 * 
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment with CLERK_DOMAIN (e.g., 'your-app.clerk.accounts.dev')
 * @returns {Object|null} User info or null if not authenticated
 */
export async function verifyClerkSession(request, env) {
  try {
    const token = getSessionToken(request);
    if (!token) {
      return null;
    }

    const clerkDomain = env.CLERK_DOMAIN;
    if (!clerkDomain) {
      console.error('CLERK_DOMAIN not configured');
      return null;
    }

    const payload = await verifyJWT(token, clerkDomain);

    // Extract user info from claims
    const email = payload.email || payload.primary_email || null;
    const userId = payload.sub;
    const metadata = payload.public_metadata || {};

    // Determine role
    const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());
    const isTeam = !isAdmin && metadata.role === 'team';
    const role = isAdmin ? 'admin' : isTeam ? 'team' : 'guest';

    return {
      userId,
      email,
      role,
      allowedAccommodations: isAdmin ? [1, 2, 3] : (metadata.accommodations || []),
      claims: payload
    };
  } catch (error) {
    console.error('Clerk auth error:', error.message);
    return null;
  }
}

/**
 * Middleware helper - require admin role
 */
export async function requireAdmin(context) {
  const user = await verifyClerkSession(context.request, context.env);
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
}

/**
 * Middleware helper - require team or admin role
 */
export async function requireTeamOrAdmin(context) {
  const user = await verifyClerkSession(context.request, context.env);
  if (!user || (user.role !== 'admin' && user.role !== 'team')) {
    return null;
  }
  return user;
}

/**
 * Middleware helper - require any authenticated user
 */
export async function requireAuth(context) {
  const user = await verifyClerkSession(context.request, context.env);
  return user;
}
