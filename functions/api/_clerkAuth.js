/**
 * Clerk JWT Verification for Cloudflare Workers
 * 
 * Roles are managed in Clerk Dashboard via publicMetadata:
 * - Admin: { "role": "admin" }
 * - Team:  { "role": "team", "accommodations": [1, 2] }
 */

// JWKS cache
let jwksCache = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

async function getJWKS(clerkDomain) {
  const now = Date.now();
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwksCache;
  }

  const response = await fetch(`https://${clerkDomain}/.well-known/jwks.json`);
  if (!response.ok) throw new Error('Failed to fetch JWKS');

  jwksCache = await response.json();
  jwksCacheTime = now;
  return jwksCache;
}

async function importJWK(jwk) {
  return await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify']
  );
}

function base64UrlDecode(str) {
  const pad = str.length % 4;
  if (pad) str += '='.repeat(4 - pad);
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyJWT(token, clerkDomain) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));
  
  if (!header.kid) throw new Error('No kid in JWT header');

  let jwks = await getJWKS(clerkDomain);
  let jwk = jwks.keys.find(k => k.kid === header.kid);
  
  if (!jwk) {
    jwksCache = null;
    jwks = await getJWKS(clerkDomain);
    jwk = jwks.keys.find(k => k.kid === header.kid);
    if (!jwk) throw new Error('No matching key found in JWKS');
  }

  const cryptoKey = await importJWK(jwk);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('JWT expired');

  return payload;
}

function getSessionToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/__session=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Verify Clerk session and return user info
 */
export async function verifyClerkSession(request, env) {
  try {
    const token = getSessionToken(request);
    if (!token) return null;

    const clerkDomain = env.CLERK_DOMAIN;
    if (!clerkDomain) return null;

    const payload = await verifyJWT(token, clerkDomain);
    const userId = payload.sub;
    
    // Role is defined in Clerk Dashboard > Users > publicMetadata
    // { "role": "admin" } or { "role": "team", "accommodations": [1,2,3] }
    const metadata = payload.public_metadata || {};
    const role = metadata.role || 'guest';
    const accommodations = metadata.accommodations || [];

    return {
      userId,
      role,
      allowedAccommodations: role === 'admin' ? [1, 2, 3] : accommodations
    };
  } catch (error) {
    console.error('Auth error:', error.message);
    return null;
  }
}

/** Require admin role */
export async function requireAdmin(context) {
  const user = await verifyClerkSession(context.request, context.env);
  return (user && user.role === 'admin') ? user : null;
}

/** Require team or admin role */
export async function requireTeamOrAdmin(context) {
  const user = await verifyClerkSession(context.request, context.env);
  return (user && (user.role === 'admin' || user.role === 'team')) ? user : null;
}

/** Verify a Clerk token and return the payload */
export async function verifyClerkToken(token, env) {
  try {
    const clerkDomain = env.CLERK_DOMAIN;
    if (!clerkDomain) return null;
    
    const payload = await verifyJWT(token, clerkDomain);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}
