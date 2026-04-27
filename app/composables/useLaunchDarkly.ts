import { computed, ref } from 'vue'

import { recordFlagEvaluation } from '~/utils/ldFlagEvaluations'

let hasListener = false
const flagsVersion = ref(0)

export const useLaunchDarkly = () => {
  const { $launchDarkly } = useNuxtApp()

  const isReady = computed(() => $launchDarkly?.isReady?.value ?? false)

  const getFlagValue = <T>(flagKey: string, defaultValue: T): T => {
    // Touch version so computed callers react to flag changes.
    flagsVersion.value
    const client = $launchDarkly?.client
    if (!client) return defaultValue
    const detail = client.variationDetail(
      flagKey,
      defaultValue as Parameters<typeof client.variationDetail>[1]
    )
    recordFlagEvaluation(flagKey, detail)
    return detail.value as T
  }

  if (!hasListener && $launchDarkly?.client) {
    hasListener = true
    $launchDarkly.client.on('change', () => {
      flagsVersion.value += 1
    })
  }

  return {
    isReady,
    getFlagValue
  }
}
