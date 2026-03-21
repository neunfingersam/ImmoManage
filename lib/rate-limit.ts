// lib/rate-limit.ts
// In-memory rate limiter — ausreichend für lokale MVP-Umgebung

const attempts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten
const MAX_ATTEMPTS = 10

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
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

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
