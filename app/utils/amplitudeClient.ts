import {
  Identify,
  identify,
  init,
  setUserId,
  track
} from '@amplitude/analytics-browser'

let configured = false

export const initAmplitudeBrowser = (apiKey: string | null | undefined) => {
  if (!apiKey || typeof window === 'undefined') return
  init(apiKey, {
    defaultTracking: {
      pageViews: false,
      sessions: true,
      formInteractions: false,
      fileDownloads: false
    }
  })
  configured = true
}

export const isAmplitudeConfigured = () => configured

export const amplitudeSetUserId = (userId: string | undefined) => {
  if (!configured) return
  setUserId(userId)
}

export const amplitudeTrack = (
  eventName: string,
  eventProperties: Record<string, unknown>
) => {
  if (!configured) return
  track(eventName, eventProperties as Record<string, unknown>)
}

const MAX_IDENTIFY_PROP_LEN = 4096

export const amplitudeIdentifyLdFlags = (
  flagProps: Record<string, string>
) => {
  if (!configured) return
  const id = new Identify()
  for (const [key, raw] of Object.entries(flagProps)) {
    const value =
      raw.length > MAX_IDENTIFY_PROP_LEN
        ? `${raw.slice(0, MAX_IDENTIFY_PROP_LEN - 1)}…`
        : raw
    id.set(key, value)
  }
  identify(id)
}
