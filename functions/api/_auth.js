// Helper function to verify session
export async function verifySession(context) {
  const cookies = context.request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/session=([^;]+)/);
  const token = sessionMatch ? sessionMatch[1] : null;

  if (!token) return false;

  const result = await context.env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();

  return !!result;
}
