import { initAmplitudeBrowser } from '~/utils/amplitudeClient'

export default defineNuxtPlugin(() => {
  const { public: publicConfig } = useRuntimeConfig()
  const apiKey =
    publicConfig.amplitudeApiKey ?? publicConfig.NUXT_PUBLIC_AMPLITUDE_API_KEY

  if (!apiKey) {
    if (import.meta.dev) {
      console.info(
        '[Amplitude] Missing API key. Set NUXT_PUBLIC_AMPLITUDE_API_KEY.'
      )
    }
    return {
      provide: {
        amplitude: {
          configured: false
        }
      }
    }
  }

  initAmplitudeBrowser(
    typeof apiKey === 'string' ? apiKey : String(apiKey)
  )

  if (import.meta.dev) {
    console.info('[Amplitude] Browser SDK initialized')
  }

  return {
    provide: {
      amplitude: {
        configured: true
      }
    }
  }
})
