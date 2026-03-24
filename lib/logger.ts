// lib/logger.ts
// Lightweight structured logger. Outputs JSON-formatted log lines to stdout.
// Extend later with external sinks (Axiom, Logtail, etc.) if needed.
// Note: intentionally uses console rather than the SystemLog DB table to avoid
// extra DB writes on hot paths. The SystemLog table can be used for a dedicated
// audit-log feature if needed later.

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  action: string
  [key: string]: unknown
}

function log(entry: LogEntry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry })
  if (entry.level === 'error') {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info: (action: string, data?: Record<string, unknown>) =>
    log({ level: 'info', action, ...data }),
  warn: (action: string, data?: Record<string, unknown>) =>
    log({ level: 'warn', action, ...data }),
  error: (action: string, data?: Record<string, unknown>) =>
    log({ level: 'error', action, ...data }),
}
