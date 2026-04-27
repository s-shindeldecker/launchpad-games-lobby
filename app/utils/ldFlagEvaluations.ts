import type { LDEvaluationDetail } from 'launchdarkly-js-client-sdk'

import { amplitudeIdentifyLdFlags, isAmplitudeConfigured } from './amplitudeClient'

export type LdStoredFlagEvaluation = {
  variationIndex: number | null
  reason: Record<string, unknown> | null
}

const evaluations: Record<string, LdStoredFlagEvaluation> = {}

/** Drop cached evaluations (e.g. after LD identify with a new user). */
export const clearLdFlagEvaluations = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  for (const key of Object.keys(evaluations)) {
    delete evaluations[key]
  }
}

const sanitizeFlagKeyForProp = (flagKey: string) =>
  flagKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 72)

const cloneReason = (reason: unknown): Record<string, unknown> | null => {
  if (!reason || typeof reason !== 'object') return null
  try {
    return JSON.parse(JSON.stringify(reason)) as Record<string, unknown>
  } catch {
    return null
  }
}

const DEBOUNCE_MS = 400
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const flushIdentifyFromEvaluations = () => {
  if (!isAmplitudeConfigured()) return
  const props: Record<string, string> = {}
  for (const [flagKey, entry] of Object.entries(evaluations)) {
    const safe = sanitizeFlagKeyForProp(flagKey)
    props[`ld_flag_${safe}`] = JSON.stringify({
      variationIndex: entry.variationIndex,
      reason: entry.reason
    })
  }
  if (Object.keys(props).length) {
    amplitudeIdentifyLdFlags(props)
  }
}

const scheduleDebouncedIdentify = () => {
  if (typeof window === 'undefined') return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    flushIdentifyFromEvaluations()
  }, DEBOUNCE_MS)
}

/** Max length for ld_flag_evaluations on a single event (Amplitude limits). */
const MAX_EVENT_SNAPSHOT_CHARS = 8192

export const recordFlagEvaluation = <T>(
  flagKey: string,
  detail: LDEvaluationDetail<T>
) => {
  evaluations[flagKey] = {
    variationIndex:
      detail.variationIndex === undefined || detail.variationIndex === null
        ? null
        : detail.variationIndex,
    reason: cloneReason(detail.reason)
  }
  scheduleDebouncedIdentify()
}

/**
 * JSON snapshot of all recorded flag evaluations for event properties.
 */
export const getLdFlagEvaluationsEventProperty = (): string => {
  const raw = JSON.stringify(evaluations)
  if (raw.length <= MAX_EVENT_SNAPSHOT_CHARS) return raw
  return `${raw.slice(0, MAX_EVENT_SNAPSHOT_CHARS - 20)}…[truncated]`
}
