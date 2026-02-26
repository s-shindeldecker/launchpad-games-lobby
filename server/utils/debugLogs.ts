type ServerLogLevel = 'info' | 'warn' | 'error'

type ServerLogEntry = {
  ts: string
  level: ServerLogLevel
  message: string
}

const MAX_LOGS = 200
const logs: ServerLogEntry[] = []

const safeStringify = (value: unknown) => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export const addServerLog = (
  level: ServerLogLevel,
  message: string,
  meta?: unknown
) => {
  const metaString = meta === undefined ? '' : ` ${safeStringify(meta)}`
  logs.push({
    ts: new Date().toISOString(),
    level,
    message: `${message}${metaString}`
  })
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS)
  }
}

export const getServerLogs = () => logs
