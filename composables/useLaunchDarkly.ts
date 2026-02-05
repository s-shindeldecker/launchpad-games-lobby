import { computed } from 'vue'

export const useLaunchDarkly = () => {
  const { $launchDarkly } = useNuxtApp()

  const isReady = computed(() => $launchDarkly?.isReady?.value ?? false)

  const getFlagValue = <T>(flagKey: string, defaultValue: T): T => {
    const client = $launchDarkly?.client
    if (!client) return defaultValue
    return client.variation(flagKey, defaultValue)
  }

  return {
    isReady,
    getFlagValue
  }
}
