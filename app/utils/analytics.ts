type AnalyticsPayload = Record<string, unknown>

const logEvent = (
  eventName: string,
  payload: AnalyticsPayload,
  numericValue?: number
) => {
  if (import.meta.dev) {
    console.info('[Analytics] Event tracked', {
      eventName,
      payload,
      numericValue
    })
  }
}

export const trackEvent = (
  eventName: string,
  payload: AnalyticsPayload = {},
  numericValue?: number
) => {
  const { $launchDarkly } = useNuxtApp()
  const client = $launchDarkly?.client

  if (client) {
    client.track(eventName, payload, numericValue)
  }

  logEvent(eventName, payload, numericValue)
}
