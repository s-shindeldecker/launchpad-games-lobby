import { getServerLogs } from '../utils/debugLogs'

export default defineEventHandler(() => ({
  logs: getServerLogs()
}))
