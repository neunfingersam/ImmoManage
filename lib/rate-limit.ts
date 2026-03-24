// lib/rate-limit.ts
// Upstash Redis rate limiter für serverlose Umgebungen.
// Fallback auf In-Memory wenn UPSTASH_REDIS_REST_URL nicht gesetzt ist.

const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten
const MAX_ATTEMPTS = 10

// ---- In-Memory Fallback (lokale Entwicklung) ----

const attempts = new Map<string, { count: number; resetAt: number }>()

function checkInMemory(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}

function resetInMemory(key: string) {
  attempts.delete(key)
}

// ---- Upstash / Vercel KV (Produktion) ----

async function checkUpstash(key: string): Promise<{ allowed: boolean; remaining: number }> {
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, '15 m'),
    prefix: 'rl',
  })

  const { success, remaining } = await ratelimit.limit(key)
  return { allowed: success, remaining }
}

// ---- Public API ----

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await checkUpstash(key)
    } catch {
      // Fallback bei Verbindungsfehler
    }
  }
  return checkInMemory(key)
}

/**
 * Resets the rate limit for a key.
 * NOTE: Only works in development (in-memory). In production (Upstash),
 * rate limits expire naturally after the window (15 min).
 * This is intentional — production resets would require an Upstash API call.
 */
export function resetRateLimit(key: string) {
  resetInMemory(key)
}
