import { ref } from 'vue'

type DebugLogEntry = {
  ts: string
  level: 'log' | 'info' | 'warn' | 'error'
  message: string
}

const MAX_LOGS = 200
const logs = ref<DebugLogEntry[]>([])

const safeStringify = (value: unknown) => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const addLog = (level: DebugLogEntry['level'], args: unknown[]) => {
  const message = args.map(safeStringify).join(' ')
  logs.value.push({
    ts: new Date().toISOString(),
    level,
    message
  })
  if (logs.value.length > MAX_LOGS) {
    logs.value.splice(0, logs.value.length - MAX_LOGS)
  }
}

const wrapConsole = () => {
  const globalKey = '__launchpadDebugLogsWrapped'
  if ((globalThis as Record<string, unknown>)[globalKey]) return
  ;(globalThis as Record<string, unknown>)[globalKey] = true

  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  }

  console.log = (...args: unknown[]) => {
    addLog('log', args)
    original.log(...args)
  }
  console.info = (...args: unknown[]) => {
    addLog('info', args)
    original.info(...args)
  }
  console.warn = (...args: unknown[]) => {
    addLog('warn', args)
    original.warn(...args)
  }
  console.error = (...args: unknown[]) => {
    addLog('error', args)
    original.error(...args)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  wrapConsole()
  nuxtApp.provide('debugLogs', {
    logs,
    clear: () => {
      logs.value = []
    }
  })
})
