// Lightweight in-memory rate limiter for public, unauthenticated write
// endpoints (inquiries, viewing requests, contact). Not distributed —
// fine for a single Next.js instance / low-to-medium traffic. Swap for a
// Redis-backed limiter (Upstash, etc.) if you scale to multiple instances.

const buckets = new Map<string, { count: number; resetAt: number }>()

// Periodically forget old buckets so this doesn't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(key)
}, 5 * 60 * 1000).unref?.()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterMs: 0 }
  }
  if (bucket.count >= limit) return { ok: false, retryAfterMs: bucket.resetAt - now }
  bucket.count += 1
  return { ok: true, retryAfterMs: 0 }
}

/** Best-effort client IP from common proxy headers (Vercel/Next sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

/** True if the honeypot field was filled in — real users never see or fill it. */
export function isHoneypotTripped(body: unknown): boolean {
  return typeof body === 'object' && body !== null && '_hp' in body && Boolean((body as Record<string, unknown>)._hp)
}
