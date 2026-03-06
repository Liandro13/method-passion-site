import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'

// ============================================
// Types
// ============================================

type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
}

type AuthUser = {
  userId: string
  role: 'admin' | 'team'
  allowedAccommodations: number[]
}

// ============================================
// Validation Schemas
// ============================================

const BookingSchema = z.object({
  accommodation_id: z.number().int().min(1).max(10),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(50),
  primary_name: z.string().min(1).max(200),
  nationality: z.string().max(100).optional(),
  additional_names: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['confirmed', 'pending', 'cancelled']).optional(),
  valor: z.number().min(0).optional(),
  imposto_municipal: z.number().min(0).optional(),
  comissao: z.number().min(0).optional(),
  taxa_bancaria: z.number().min(0).optional(),
  valor_sem_comissoes: z.number().min(0).optional(),
  valor_sem_iva: z.number().min(0).optional(),
  iva: z.number().min(0).optional(),
  plataforma: z.string().max(100).optional(),
})

const BlockedDateSchema = z.object({
  accommodation_id: z.number().int().min(1).max(10),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
})

const AccommodationUpdateSchema = z.object({
  id: z.number().int().min(1),
  name: z.string().min(1).max(200).optional(),
  description_pt: z.string().max(5000).optional(),
  description_en: z.string().max(5000).optional(),
  description_fr: z.string().max(5000).optional(),
  description_de: z.string().max(5000).optional(),
  description_es: z.string().max(5000).optional(),
  max_guests: z.number().int().min(1).max(50).optional(),
  amenities: z.record(z.array(z.string())).optional(),
})

// ============================================
// Auth Helper
// ============================================

let jwksCache: { keys: JsonWebKey[]; expires: number } | null = null

async function verifyClerkJWT(token: string): Promise<AuthUser | null> {
  try {
    // Fetch JWKS with caching
    if (!jwksCache || Date.now() > jwksCache.expires) {
      const res = await fetch('https://clerk.method-passion.com/.well-known/jwks.json')
      const data = await res.json() as { keys: JsonWebKey[] }
      jwksCache = { keys: data.keys, expires: Date.now() + 3600000 } // 1 hour
    }

    // Decode token header to get kid
    const [headerB64] = token.split('.')
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')))
    
    const jwk = jwksCache.keys.find((k: any) => k.kid === header.kid)
    if (!jwk) {
      console.log('[Auth] No matching JWK found for kid:', header.kid)
      return null
    }

    // Import key and verify
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const [, payloadB64, signatureB64] = token.split('.')
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
    if (!valid) {
      console.log('[Auth] Signature verification failed')
      return null
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    console.log('[Auth] JWT payload:', JSON.stringify(payload))
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('[Auth] Token expired')
      return null
    }

    // Extract role from publicMetadata or metadata
    const metadata = payload.publicMetadata || payload.public_metadata || payload.metadata || {}
    const role = metadata.role || 'admin' // Default to admin for now
    const allowedAccommodations = role === 'admin' ? [1, 2, 3] : (metadata.allowedAccommodations || metadata.accommodations || [])

    console.log('[Auth] User authenticated:', { userId: payload.sub, role, allowedAccommodations })
    return { userId: payload.sub, role, allowedAccommodations }
  } catch (e) {
    console.error('[Auth] Error verifying JWT:', e)
    return null
  }
}

// ============================================
// App Setup
// ============================================

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

// Global error handler
app.onError((err, c) => {
  if (err.message === 'Unauthorized') {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  console.error('API Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// CORS - Restrict to allowed origins
const ALLOWED_ORIGINS = [
  'https://method-passion.pages.dev',
  'https://method-passion-site.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
]

app.use('*', cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Auth middleware (sets c.var.user if authenticated)
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const user = await verifyClerkJWT(authHeader.slice(7))
    if (user) c.set('user', user)
  }
  await next()
})

// Helper to require auth
function requireAuth(c: any): AuthUser {
  const user = c.get('user')
  if (!user) throw new Error('Unauthorized')
  return user
}

// ============================================
// ACCOMMODATIONS
// ============================================

// GET /api/accommodations - Public
app.get('/accommodations', async (c) => {
  const { results: accommodations } = await c.env.DB.prepare('SELECT * FROM accommodations ORDER BY id').all()
  const { results: images } = await c.env.DB.prepare('SELECT * FROM accommodation_images ORDER BY display_order').all()
  
  // Attach images to each accommodation
  const accommodationsWithImages = (accommodations || []).map((acc: any) => ({
    ...acc,
    images: (images || []).filter((img: any) => img.accommodation_id === acc.id)
  }))
  
  return c.json({ accommodations: accommodationsWithImages })
})

// PUT /api/accommodations - Admin only
app.put('/accommodations', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json()
  const parsed = AccommodationUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const { id, amenities, ...fields } = parsed.data
  
  // Whitelist allowed fields
  const ALLOWED_FIELDS = ['name', 'description_pt', 'description_en', 'description_fr', 'description_de', 'description_es', 'max_guests']
  const updates: string[] = []
  const values: any[] = []

  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.includes(key) && value !== undefined) {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (amenities) {
    updates.push('amenities = ?')
    values.push(JSON.stringify(amenities))
  }

  if (updates.length === 0) return c.json({ error: 'No valid fields to update' }, 400)

  values.push(id)
  await c.env.DB.prepare(`UPDATE accommodations SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  return c.json({ success: true })
})

// ============================================
// BOOKINGS
// ============================================

// GET /api/bookings - Auth required
app.get('/bookings', async (c) => {
  const user = requireAuth(c)
  
  const accommodationId = c.req.query('accommodation_id')
  const status = c.req.query('status')

  let sql = `
    SELECT b.*, a.name as accommodation_name 
    FROM bookings b
    JOIN accommodations a ON b.accommodation_id = a.id
    WHERE 1=1
  `
  const params: any[] = []

  // IDOR protection: team users can only see their accommodations
  if (user.role !== 'admin') {
    sql += ` AND b.accommodation_id IN (${user.allowedAccommodations.map(() => '?').join(',')})`
    params.push(...user.allowedAccommodations)
  }

  if (accommodationId) {
    const accId = parseInt(accommodationId)
    if (isNaN(accId)) return c.json({ error: 'Invalid accommodation_id' }, 400)
    sql += ' AND b.accommodation_id = ?'
    params.push(accId)
  }

  if (status) {
    sql += ' AND b.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY b.check_in DESC'

  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  
  // Strip financial fields for team users
  if (user.role === 'team') {
    const sanitizedBookings = (results || []).map((booking: any) => {
      const { valor, imposto_municipal, comissao, taxa_bancaria, valor_sem_comissoes, valor_sem_iva, iva, plataforma, ...rest } = booking
      return rest
    })
    return c.json({ bookings: sanitizedBookings })
  }
  
  return c.json({ bookings: results })
})

// POST /api/bookings - Auth required
app.post('/bookings', async (c) => {
  const user = requireAuth(c)

  const body = await c.req.json()
  const parsed = BookingSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const data = parsed.data

  // Validate dates
  if (new Date(data.check_in) >= new Date(data.check_out)) {
    return c.json({ error: 'Check-out must be after check-in' }, 400)
  }

  // IDOR: Check user can access this accommodation
  if (user.role !== 'admin' && !user.allowedAccommodations.includes(data.accommodation_id)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO bookings (accommodation_id, check_in, check_out, guests, nationality, primary_name, additional_names, notes, status, valor, imposto_municipal, comissao, taxa_bancaria, valor_sem_comissoes, valor_sem_iva, iva, plataforma)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.accommodation_id,
    data.check_in,
    data.check_out,
    data.guests,
    data.nationality || '',
    data.primary_name,
    data.additional_names || '',
    data.notes || '',
    data.status || 'pending',
    data.valor || 0,
    data.imposto_municipal || 0,
    data.comissao || 0,
    data.taxa_bancaria || 0,
    data.valor_sem_comissoes || 0,
    data.valor_sem_iva || 0,
    data.iva || 0,
    data.plataforma || ''
  ).run()

  return c.json({ success: true, id: result.meta.last_row_id }, 201)
})

// GET /api/bookings/:id - Auth required
app.get('/bookings/:id', async (c) => {
  const user = requireAuth(c)
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const booking = await c.env.DB.prepare(`
    SELECT b.*, a.name as accommodation_name 
    FROM bookings b
    JOIN accommodations a ON b.accommodation_id = a.id
    WHERE b.id = ?
  `).bind(id).first()

  if (!booking) return c.json({ error: 'Not found' }, 404)

  // IDOR protection
  if (user.role !== 'admin' && !user.allowedAccommodations.includes(booking.accommodation_id as number)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Strip financial fields for team users
  if (user.role === 'team') {
    const { valor, imposto_municipal, comissao, taxa_bancaria, valor_sem_comissoes, valor_sem_iva, iva, plataforma, ...rest } = booking as any
    return c.json(rest)
  }

  return c.json(booking)
})

// PUT /api/bookings/:id - Auth required
app.put('/bookings/:id', async (c) => {
  const user = requireAuth(c)
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  // Verify booking exists and user has access
  const existing = await c.env.DB.prepare('SELECT accommodation_id FROM bookings WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  if (user.role !== 'admin' && !user.allowedAccommodations.includes(existing.accommodation_id as number)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json()
  const parsed = BookingSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const data = parsed.data
  if (Object.keys(data).length === 0) return c.json({ error: 'No fields to update' }, 400)

  // Whitelist fields
  const ALLOWED = ['check_in', 'check_out', 'guests', 'nationality', 'primary_name', 'additional_names', 'notes', 'status', 'valor', 'imposto_municipal', 'comissao', 'taxa_bancaria', 'valor_sem_comissoes', 'valor_sem_iva', 'iva', 'plataforma']
  const updates: string[] = []
  const values: any[] = []

  for (const [key, value] of Object.entries(data)) {
    if (ALLOWED.includes(key) && value !== undefined) {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (updates.length === 0) return c.json({ error: 'No valid fields' }, 400)

  updates.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  await c.env.DB.prepare(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ success: true })
})

// DELETE /api/bookings/:id - Auth required
app.delete('/bookings/:id', async (c) => {
  const user = requireAuth(c)
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const existing = await c.env.DB.prepare('SELECT accommodation_id FROM bookings WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  if (user.role !== 'admin' && !user.allowedAccommodations.includes(existing.accommodation_id as number)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ============================================
// DASHBOARD STATS
// ============================================

// GET /api/dashboard/stats - Admin only
app.get('/dashboard/stats', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const startDate = c.req.query('start_date')
  const endDate = c.req.query('end_date')

  if (!startDate || !endDate) {
    return c.json({ error: 'start_date and end_date are required' }, 400)
  }

  // Calculate days in period for occupancy
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // Get bookings in period (using check_in date)
  const { results: bookings } = await c.env.DB.prepare(`
    SELECT 
      b.id,
      b.accommodation_id,
      a.name as accommodation_name,
      b.check_in,
      b.check_out,
      b.guests,
      b.status,
      b.nationality,
      b.plataforma,
      b.valor,
      b.valor_sem_comissoes,
      b.comissao,
      b.iva,
      b.taxa_bancaria,
      CAST(julianday(b.check_out) - julianday(b.check_in) AS INTEGER) as nights
    FROM bookings b
    JOIN accommodations a ON b.accommodation_id = a.id
    WHERE b.check_in >= ? AND b.check_in <= ?
    ORDER BY b.check_in
  `).bind(startDate, endDate).all()

  // Get blocked dates in period
  const { results: blockedDates } = await c.env.DB.prepare(`
    SELECT 
      accommodation_id,
      start_date,
      end_date,
      CAST(julianday(end_date) - julianday(start_date) AS INTEGER) as blocked_nights
    FROM blocked_dates
    WHERE start_date <= ? AND end_date >= ?
  `).bind(endDate, startDate).all()

  // Calculate stats per accommodation
  const accommodationStats: Record<number, any> = {
    1: { id: 1, name: 'Esperança Terrace', bookings: [], blockedNights: 0 },
    2: { id: 2, name: 'Nattura Gerês Village', bookings: [], blockedNights: 0 },
    3: { id: 3, name: 'Douro & Sabor Escape', bookings: [], blockedNights: 0 }
  }

  // Attach bookings to accommodations
  for (const booking of (bookings || [])) {
    const accId = booking.accommodation_id as number
    if (accommodationStats[accId]) {
      accommodationStats[accId].bookings.push(booking)
    }
  }

  // Calculate blocked nights per accommodation
  for (const blocked of (blockedDates || [])) {
    const accId = blocked.accommodation_id as number
    if (accommodationStats[accId]) {
      accommodationStats[accId].blockedNights += (blocked.blocked_nights as number) || 0
    }
  }

  // Calculate aggregate stats
  const calculateStats = (bookingsList: any[]) => {
    const confirmed = bookingsList.filter(b => b.status === 'confirmed')
    const pending = bookingsList.filter(b => b.status === 'pending')
    const cancelled = bookingsList.filter(b => b.status === 'cancelled')
    
    const totalNights = confirmed.reduce((sum, b) => sum + ((b.nights as number) || 0), 0)
    const totalRevenue = confirmed.reduce((sum, b) => sum + ((b.valor as number) || 0), 0)
    const netRevenue = confirmed.reduce((sum, b) => sum + ((b.valor_sem_comissoes as number) || 0), 0)
    const totalCommissions = confirmed.reduce((sum, b) => sum + ((b.comissao as number) || 0), 0)
    const totalIva = confirmed.reduce((sum, b) => sum + ((b.iva as number) || 0), 0)
    const totalGuests = confirmed.reduce((sum, b) => sum + ((b.guests as number) || 0), 0)

    // Platform breakdown
    const platformBreakdown: Record<string, { count: number; revenue: number }> = {}
    for (const b of confirmed) {
      const platform = (b.plataforma as string) || 'Direto'
      if (!platformBreakdown[platform]) {
        platformBreakdown[platform] = { count: 0, revenue: 0 }
      }
      platformBreakdown[platform].count++
      platformBreakdown[platform].revenue += (b.valor as number) || 0
    }

    // Nationality breakdown (top 5)
    const nationalityMap: Record<string, number> = {}
    for (const b of confirmed) {
      const nat = (b.nationality as string) || 'Desconhecido'
      nationalityMap[nat] = (nationalityMap[nat] || 0) + 1
    }
    const nationalityBreakdown = Object.entries(nationalityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nationality, count]) => ({ nationality, count }))

    return {
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      totalBookings: bookingsList.length,
      totalNights,
      totalRevenue,
      netRevenue,
      totalCommissions,
      totalIva,
      totalGuests,
      avgStayDuration: confirmed.length > 0 ? totalNights / confirmed.length : 0,
      avgRevenuePerBooking: confirmed.length > 0 ? totalRevenue / confirmed.length : 0,
      avgRevenuePerNight: totalNights > 0 ? totalRevenue / totalNights : 0,
      avgGuestsPerBooking: confirmed.length > 0 ? totalGuests / confirmed.length : 0,
      cancellationRate: bookingsList.length > 0 ? (cancelled.length / bookingsList.length) * 100 : 0,
      platformBreakdown,
      nationalityBreakdown
    }
  }

  // Global stats
  const allBookings = bookings || []
  const globalStats = calculateStats(allBookings)

  // Per-accommodation stats
  const perAccommodation = Object.values(accommodationStats).map((acc: any) => {
    const stats = calculateStats(acc.bookings)
    const availableDays = daysInPeriod - acc.blockedNights
    const occupancyRate = availableDays > 0 ? (stats.totalNights / availableDays) * 100 : 0

    return {
      id: acc.id,
      name: acc.name,
      ...stats,
      blockedNights: acc.blockedNights,
      availableDays,
      occupancyRate: Math.min(occupancyRate, 100) // Cap at 100%
    }
  })

  // Calculate global occupancy (3 accommodations)
  const totalAvailableDays = daysInPeriod * 3 - perAccommodation.reduce((sum, a) => sum + a.blockedNights, 0)
  const globalOccupancyRate = totalAvailableDays > 0 
    ? (globalStats.totalNights / totalAvailableDays) * 100 
    : 0

  return c.json({
    period: { startDate, endDate, daysInPeriod },
    global: {
      ...globalStats,
      occupancyRate: Math.min(globalOccupancyRate, 100)
    },
    perAccommodation
  })
})

// ============================================
// BLOCKED DATES
// ============================================

// GET /api/blocked-dates - Auth required
app.get('/blocked-dates', async (c) => {
  const user = requireAuth(c)
  const accommodationId = c.req.query('accommodation_id')

  let sql = 'SELECT * FROM blocked_dates WHERE 1=1'
  const params: any[] = []

  if (user.role !== 'admin') {
    sql += ` AND accommodation_id IN (${user.allowedAccommodations.map(() => '?').join(',')})`
    params.push(...user.allowedAccommodations)
  }

  if (accommodationId) {
    const accId = parseInt(accommodationId)
    if (isNaN(accId)) return c.json({ error: 'Invalid accommodation_id' }, 400)
    sql += ' AND accommodation_id = ?'
    params.push(accId)
  }

  sql += ' ORDER BY start_date DESC'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json({ blockedDates: results })
})

// POST /api/blocked-dates - Auth required
app.post('/blocked-dates', async (c) => {
  const user = requireAuth(c)

  const body = await c.req.json()
  const parsed = BlockedDateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const data = parsed.data

  if (new Date(data.start_date) >= new Date(data.end_date)) {
    return c.json({ error: 'End date must be after start date' }, 400)
  }

  if (user.role !== 'admin' && !user.allowedAccommodations.includes(data.accommodation_id)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO blocked_dates (accommodation_id, start_date, end_date, reason)
    VALUES (?, ?, ?, ?)
  `).bind(data.accommodation_id, data.start_date, data.end_date, data.reason || '').run()

  return c.json({ success: true, id: result.meta.last_row_id }, 201)
})

// DELETE /api/blocked-dates/:id - Auth required
app.delete('/blocked-dates/:id', async (c) => {
  const user = requireAuth(c)
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const existing = await c.env.DB.prepare('SELECT accommodation_id FROM blocked_dates WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  if (user.role !== 'admin' && !user.allowedAccommodations.includes(existing.accommodation_id as number)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM blocked_dates WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ============================================
// CHECK AVAILABILITY - Public (by name, for website)
// ============================================

app.post('/check-availability', async (c) => {
  const body = await c.req.json()
  const { accommodation, checkIn, checkOut, excludeBookingId } = body

  if (!accommodation) {
    return c.json({ error: 'Missing accommodation' }, 400)
  }

  // Get accommodation ID (support both name and id)
  let accId: number
  if (typeof accommodation === 'number') {
    accId = accommodation
  } else {
    const acc = await c.env.DB.prepare('SELECT id FROM accommodations WHERE name = ?').bind(accommodation).first() as { id: number } | null
    if (!acc) return c.json({ error: 'Accommodation not found' }, 404)
    accId = acc.id
  }

  // If no dates provided, return all booked dates for the calendar
  if (!checkIn || !checkOut) {
    // Get all future bookings (for calendar display)
    const today = new Date().toISOString().split('T')[0]
    const { results: allBookings } = await c.env.DB.prepare(`
      SELECT check_in, check_out FROM bookings 
      WHERE accommodation_id = ? 
      AND status != 'cancelled'
      AND check_out >= ?
      ORDER BY check_in
    `).bind(accId, today).all() as { results: Array<{ check_in: string; check_out: string }> }

    // Get all future blocked dates
    const { results: allBlocked } = await c.env.DB.prepare(`
      SELECT start_date as check_in, end_date as check_out FROM blocked_dates 
      WHERE accommodation_id = ? 
      AND end_date >= ?
      ORDER BY start_date
    `).bind(accId, today).all() as { results: Array<{ check_in: string; check_out: string }> }

    // Combine bookings and blocked dates
    const bookedDates = [
      ...allBookings.map(b => ({ checkIn: b.check_in, checkOut: b.check_out })),
      ...allBlocked.map(b => ({ checkIn: b.check_in, checkOut: b.check_out }))
    ]

    return c.json({ available: true, bookedDates })
  }

  // Check for booking conflicts
  let bookingQuery = `
    SELECT id, primary_name, check_in, check_out FROM bookings 
    WHERE accommodation_id = ? 
    AND status != 'cancelled'
    AND check_in < ? AND check_out > ?
  `
  const params: any[] = [accId, checkOut, checkIn]
  
  if (excludeBookingId) {
    bookingQuery += ' AND id != ?'
    params.push(excludeBookingId)
  }

  const { results: bookingConflicts } = await c.env.DB.prepare(bookingQuery).bind(...params).all() as { results: Array<{ id: number; primary_name: string; check_in: string; check_out: string }> }

  const { results: blockedConflicts } = await c.env.DB.prepare(`
    SELECT id, reason, start_date, end_date FROM blocked_dates 
    WHERE accommodation_id = ? 
    AND start_date < ? AND end_date > ?
  `).bind(accId, checkOut, checkIn).all() as { results: Array<{ id: number; reason: string; start_date: string; end_date: string }> }

  const available = bookingConflicts.length === 0 && blockedConflicts.length === 0
  let message: string | null = null

  if (bookingConflicts.length > 0) {
    const conflict = bookingConflicts[0]
    message = `Conflito com reserva de ${conflict.primary_name} (${conflict.check_in} a ${conflict.check_out})`
  } else if (blockedConflicts.length > 0) {
    const conflict = blockedConflicts[0]
    message = `Datas bloqueadas: ${conflict.reason || 'Indisponível'} (${conflict.start_date} a ${conflict.end_date})`
  }

  return c.json({ available, message, conflicts: bookingConflicts.length + blockedConflicts.length })
})

// ============================================
// FINANCIAL CALCULATIONS - Admin only
// ============================================

app.post('/calculate-financials', async (c) => {
  const user = requireAuth(c)
  const body = await c.req.json()
  const { valor, comissao, taxaBancaria, iva } = body

  // Server-side calculation to ensure consistency
  const valorSemComissoes = Math.round((valor - comissao - taxaBancaria) * 100) / 100
  const valorSemIva = Math.round((valorSemComissoes - iva) * 100) / 100

  return c.json({ valorSemComissoes, valorSemIva })
})

// ============================================
// IMAGES - File serving handled by separate route
// ============================================

// GET /api/images - Public list
app.get('/images', async (c) => {
  const accommodationId = c.req.query('accommodation_id')
  
  let sql = 'SELECT * FROM accommodation_images'
  const params: any[] = []
  
  if (accommodationId) {
    sql += ' WHERE accommodation_id = ?'
    params.push(parseInt(accommodationId))
  }
  
  sql += ' ORDER BY display_order'
  
  try {
    const { results } = await c.env.DB.prepare(sql).bind(...params).all()
    return c.json(results || [])
  } catch {
    // Table might not exist yet
    return c.json([])
  }
})

// POST /api/images - Admin only
app.post('/images', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const formData = await c.req.formData()
  const file = formData.get('file') as File
  const accommodationId = formData.get('accommodation_id') as string
  const caption = formData.get('caption') as string

  if (!file || !accommodationId) {
    return c.json({ error: 'File and accommodation_id required' }, 400)
  }

  // Validate file type
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: 'Invalid file type' }, 400)
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 10MB)' }, 400)
  }

  const accId = parseInt(accommodationId)
  if (isNaN(accId)) return c.json({ error: 'Invalid accommodation_id' }, 400)

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `accommodations/${accId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Upload to R2
  await c.env.IMAGES.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type }
  })

  // Get next display order
  const { results } = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM accommodation_images WHERE accommodation_id = ?'
  ).bind(accId).all()
  const displayOrder = (results[0] as any)?.next_order || 1

  // Save to database
  const result = await c.env.DB.prepare(`
    INSERT INTO accommodation_images (accommodation_id, image_url, display_order, caption, is_primary)
    VALUES (?, ?, ?, ?, ?)
  `).bind(accId, `/api/images/file/${filename}`, displayOrder, caption || '', displayOrder === 1).run()

  return c.json({ 
    success: true, 
    id: result.meta.last_row_id,
    url: `/api/images/file/${filename}`
  }, 201)
})

// DELETE /api/images/:id - Admin only
app.delete('/images/:id', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const image = await c.env.DB.prepare('SELECT image_url FROM accommodation_images WHERE id = ?').bind(id).first()
  if (!image) return c.json({ error: 'Not found' }, 404)

  // Delete from R2
  const r2Key = (image.image_url as string).replace('/api/images/file/', '')
  await c.env.IMAGES.delete(r2Key)

  // Delete from database
  await c.env.DB.prepare('DELETE FROM accommodation_images WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// ============================================
// TEAM USERS - Admin only
// ============================================

// GET /api/team-users
app.get('/team-users', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const { results } = await c.env.DB.prepare('SELECT id, username, name, allowed_accommodations, created_at FROM team_users ORDER BY name').all()
  return c.json({ users: results })
})

// POST /api/team-users
app.post('/team-users', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json()
  const { username, password, name, allowed_accommodations } = body

  if (!username || !password || !name) {
    return c.json({ error: 'Username, password and name are required' }, 400)
  }

  // Simple password hash (in production, use bcrypt)
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO team_users (username, password_hash, name, allowed_accommodations)
      VALUES (?, ?, ?, ?)
    `).bind(username, passwordHash, name, JSON.stringify(allowed_accommodations || [])).run()

    return c.json({ success: true, id: result.meta.last_row_id }, 201)
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'Username already exists' }, 400)
    }
    throw err
  }
})

// PUT /api/team-users/:id
app.put('/team-users/:id', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const { username, password, name, allowed_accommodations } = body

  const updates: string[] = []
  const values: any[] = []

  if (username) {
    updates.push('username = ?')
    values.push(username)
  }
  if (name) {
    updates.push('name = ?')
    values.push(name)
  }
  if (allowed_accommodations !== undefined) {
    updates.push('allowed_accommodations = ?')
    values.push(JSON.stringify(allowed_accommodations))
  }
  if (password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    updates.push('password_hash = ?')
    values.push(passwordHash)
  }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

  values.push(id)
  await c.env.DB.prepare(`UPDATE team_users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

  return c.json({ success: true })
})

// DELETE /api/team-users/:id
app.delete('/team-users/:id', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  await c.env.DB.prepare('DELETE FROM team_sessions WHERE team_user_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM team_users WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// ============================================
// BACKUP SYSTEM
// ============================================

const BACKUP_EMAILS = [
  'liandrodacruz@outlook.pt',
  'joanabatista11@gmail.com',
  'nelson_dacruz@hotmail.com'
]
const BACKUP_FROM = 'backups@method-passion.com'

// Helper: Check if Portugal is in summer time (last Sunday March to last Sunday October)
function isPortugalSummerTime(date: Date): boolean {
  const year = date.getUTCFullYear()
  
  // Last Sunday of March
  const marchLast = new Date(Date.UTC(year, 2, 31))
  while (marchLast.getUTCDay() !== 0) marchLast.setUTCDate(marchLast.getUTCDate() - 1)
  
  // Last Sunday of October  
  const octoberLast = new Date(Date.UTC(year, 9, 31))
  while (octoberLast.getUTCDay() !== 0) octoberLast.setUTCDate(octoberLast.getUTCDate() - 1)
  
  // Summer time: from last Sunday March 1:00 UTC to last Sunday October 1:00 UTC
  const summerStart = new Date(marchLast.getTime() + 1 * 60 * 60 * 1000)
  const summerEnd = new Date(octoberLast.getTime() + 1 * 60 * 60 * 1000)
  
  return date >= summerStart && date < summerEnd
}

// Helper: Convert data to CSV
function toCSV(data: any[], filename: string): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

// Helper: Send email via Resend
async function sendBackupEmail(
  env: any,
  subject: string,
  html: string,
  attachments?: { filename: string; content: string }[]
): Promise<boolean> {
  const resendKey = env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[Backup] RESEND_API_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: BACKUP_FROM,
        to: BACKUP_EMAILS,
        subject,
        html,
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: btoa(unescape(encodeURIComponent(a.content)))
        }))
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Backup] Resend error:', error)
      return false
    }

    console.log('[Backup] Email sent successfully')
    return true
  } catch (e) {
    console.error('[Backup] Email send error:', e)
    return false
  }
}

// POST /api/admin/backup/send - Send backup email (Admin or Cron)
app.post('/admin/backup/send', async (c) => {
  // Check auth: either admin user OR cron secret
  const authHeader = c.req.header('Authorization')
  const cronSecret = c.req.header('X-Cron-Secret')
  
  let isAuthorized = false
  
  // Check cron secret first (for GitHub Actions)
  if (cronSecret && cronSecret === (c.env as any).BACKUP_SECRET) {
    isAuthorized = true
    console.log('[Backup] Authorized via cron secret')
  } else if (authHeader?.startsWith('Bearer ')) {
    // Check Clerk JWT for admin
    const user = await verifyClerkJWT(authHeader.slice(7))
    if (user?.role === 'admin') {
      isAuthorized = true
      console.log('[Backup] Authorized via admin JWT')
    }
  }
  
  if (!isAuthorized) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]

  try {
    // Export all data
    const [bookingsResult, blockedResult, accommodationsResult] = await Promise.all([
      c.env.DB.prepare(`
        SELECT b.*, a.name as accommodation_name 
        FROM bookings b
        JOIN accommodations a ON b.accommodation_id = a.id
        ORDER BY b.check_in DESC
      `).all(),
      c.env.DB.prepare('SELECT * FROM blocked_dates ORDER BY start_date DESC').all(),
      c.env.DB.prepare('SELECT * FROM accommodations ORDER BY id').all()
    ])

    const bookings = bookingsResult.results || []
    const blockedDates = blockedResult.results || []
    const accommodations = accommodationsResult.results || []

    // Generate CSVs
    const bookingsCSV = toCSV(bookings, 'reservas')
    const blockedCSV = toCSV(blockedDates, 'datas_bloqueadas')
    const accommodationsCSV = toCSV(accommodations, 'alojamentos')

    // Combine into one file with sections
    const fullBackupCSV = [
      '# BACKUP METHOD & PASSION - ' + dateStr,
      '# Gerado automaticamente',
      '',
      '## RESERVAS (' + bookings.length + ' registos)',
      bookingsCSV,
      '',
      '## DATAS BLOQUEADAS (' + blockedDates.length + ' registos)',
      blockedCSV,
      '',
      '## ALOJAMENTOS (' + accommodations.length + ' registos)',
      accommodationsCSV
    ].join('\n')

    // Save to R2
    const r2Key = `backups/backup-${dateStr}.csv`
    await c.env.IMAGES.put(r2Key, fullBackupCSV, {
      customMetadata: {
        type: 'database-backup',
        timestamp: now.toISOString(),
        bookings_count: String(bookings.length),
        blocked_count: String(blockedDates.length)
      }
    })
    console.log('[Backup] Saved to R2:', r2Key)

    // Clean old backups (keep last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const listResult = await c.env.IMAGES.list({ prefix: 'backups/' })
    
    for (const obj of listResult.objects) {
      const match = obj.key.match(/backup-(\d{4}-\d{2}-\d{2})\.csv/)
      if (match) {
        const backupDate = new Date(match[1])
        if (backupDate < thirtyDaysAgo) {
          await c.env.IMAGES.delete(obj.key)
          console.log('[Backup] Deleted old backup:', obj.key)
        }
      }
    }

    // Send email
    const portugalTime = isPortugalSummerTime(now) ? 'WEST (UTC+1)' : 'WET (UTC)'
    const emailSent = await sendBackupEmail(
      c.env,
      `✅ Backup Method & Passion - ${dateStr}`,
      `
        <h2>Backup Diário - Method & Passion</h2>
        <p><strong>Data:</strong> ${dateStr}</p>
        <p><strong>Hora:</strong> ${now.toISOString()} (${portugalTime})</p>
        <hr>
        <h3>Resumo</h3>
        <ul>
          <li><strong>Reservas:</strong> ${bookings.length} registos</li>
          <li><strong>Datas Bloqueadas:</strong> ${blockedDates.length} registos</li>
          <li><strong>Alojamentos:</strong> ${accommodations.length} registos</li>
        </ul>
        <hr>
        <p><em>Este backup foi guardado automaticamente no R2 e ficará disponível durante 30 dias.</em></p>
        <p><em>O ficheiro CSV está em anexo.</em></p>
      `,
      [{ filename: `backup-${dateStr}.csv`, content: fullBackupCSV }]
    )

    return c.json({ 
      success: true, 
      date: dateStr,
      stats: {
        bookings: bookings.length,
        blocked_dates: blockedDates.length,
        accommodations: accommodations.length
      },
      r2_key: r2Key,
      email_sent: emailSent
    })

  } catch (error) {
    console.error('[Backup] Error:', error)
    
    // Send failure notification
    await sendBackupEmail(
      c.env,
      `🚨 FALHA no Backup - ${dateStr}`,
      `
        <h2>⚠️ Erro no Backup</h2>
        <p><strong>Data:</strong> ${dateStr}</p>
        <p><strong>Erro:</strong> ${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <hr>
        <p><em>Por favor verifique o sistema.</em></p>
      `
    )

    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Backup failed'
    }, 500)
  }
})

// GET /api/admin/backup/status - Check backup status
app.get('/admin/backup/status', async (c) => {
  const user = requireAuth(c)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  try {
    const listResult = await c.env.IMAGES.list({ prefix: 'backups/' })
    
    const backups = listResult.objects
      .filter(obj => obj.key.endsWith('.csv'))
      .map(obj => ({
        key: obj.key,
        date: obj.key.match(/backup-(\d{4}-\d{2}-\d{2})\.csv/)?.[1],
        size: obj.size,
        uploaded: obj.uploaded
      }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    return c.json({
      total_backups: backups.length,
      latest_backup: backups[0] || null,
      backups: backups.slice(0, 10) // Last 10
    })
  } catch (error) {
    return c.json({ error: 'Failed to check backup status' }, 500)
  }
})

// ============================================
// Export for Cloudflare Pages Functions
// ============================================

export const onRequest: PagesFunction<Bindings> = (context) => {
  return app.fetch(context.request, context.env, context)
}
