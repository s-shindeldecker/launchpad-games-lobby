import { initialize } from 'launchdarkly-js-client-sdk'
import { ref } from 'vue'

const LD_ANON_KEY_STORAGE = 'ld-anon-key'

const isReady = ref(false)
let ldClient: ReturnType<typeof initialize> | null = null

const getAnonKey = () => {
  if (typeof window === 'undefined') return 'anon-server'
  const existing = window.localStorage.getItem(LD_ANON_KEY_STORAGE)
  if (existing) return existing
  const generated = `anon-${crypto.randomUUID?.() ?? Date.now().toString(36)}`
  window.localStorage.setItem(LD_ANON_KEY_STORAGE, generated)
  return generated
}

export default defineNuxtPlugin(async () => {
  const { public: publicConfig } = useRuntimeConfig()
  const clientId =
    publicConfig.ldClientId ?? publicConfig.NUXT_PUBLIC_LD_CLIENT_ID
  if (!clientId) {
    if (import.meta.dev) {
      console.info(
        '[LaunchDarkly] Missing client ID. Set NUXT_PUBLIC_LD_CLIENT_ID.'
      )
    }
    return {
      provide: {
        launchDarkly: {
          client: null,
          isReady
        }
      }
    }
  }

  const context = {
    kind: 'user',
    key: getAnonKey(),
    anonymous: true,
    device: 'mobile',
    platform: 'web'
  }

  // Client-only initialization; keeps flags ready for composables.
  ldClient = initialize(clientId, context)
  await ldClient.waitForInitialization()
  isReady.value = true
  if (import.meta.dev) {
    console.info('[LaunchDarkly] Client initialized', { key: context.key })
  }

  return {
    provide: {
      launchDarkly: {
        client: ldClient,
        isReady
      }
    }
  }
})
