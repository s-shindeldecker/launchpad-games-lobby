import { amplitudeTrack } from '~/utils/amplitudeClient'
import { getLdFlagEvaluationsEventProperty } from '~/utils/ldFlagEvaluations'

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

  const amplitudePayload: AnalyticsPayload = { ...payload }
  if (numericValue !== undefined) {
    amplitudePayload.numericValue = numericValue
  }
  amplitudePayload.ld_flag_evaluations = getLdFlagEvaluationsEventProperty()

  amplitudeTrack(eventName, amplitudePayload)

  if (client) {
    client.track(eventName, payload, numericValue)
  }

  logEvent(eventName, payload, numericValue)
}
