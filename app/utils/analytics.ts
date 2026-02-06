type AnalyticsPayload = Record<string, unknown>

const logEvent = (eventName: string, payload: AnalyticsPayload) => {
  if (import.meta.dev) {
    console.info('[Analytics] Event tracked', { eventName, payload })
  }
}

export const trackEvent = (
  eventName: string,
  payload: AnalyticsPayload = {}
) => {
  const { $launchDarkly } = useNuxtApp()
  const client = $launchDarkly?.client

  if (client) {
    client.track(eventName, payload)
  }

  logEvent(eventName, payload)
}
