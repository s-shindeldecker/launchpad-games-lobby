import { initialize } from 'launchdarkly-js-client-sdk'
import { ref } from 'vue'

const LD_USER_KEY_STORAGE = 'ld-user-key'
const LD_ANON_KEY_STORAGE = 'ld-anon-key'

const isReady = ref(false)
let ldClient: ReturnType<typeof initialize> | null = null

const createUserKey = () => {
  if (typeof window === 'undefined') return 'user-server'
  const generated = `user-${crypto.randomUUID?.() ?? Date.now().toString(36)}`
  window.localStorage.setItem(LD_USER_KEY_STORAGE, generated)
  return generated
}

const getUserKey = () => {
  if (typeof window === 'undefined') return 'user-server'
  // Clean up legacy anonymous key to avoid confusion in demo data.
  window.localStorage.removeItem(LD_ANON_KEY_STORAGE)
  const existing = window.localStorage.getItem(LD_USER_KEY_STORAGE)
  if (existing) return existing
  return createUserKey()
}

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY'
]

const OWNED_PLATFORMS = ['Switch', 'Playstation', 'Xbox', 'PC']

const pickRandom = <T>(values: T[]) =>
  values[Math.floor(Math.random() * values.length)]

const pickUnique = <T>(values: T[], count: number) => {
  const pool = [...values]
  const selected: T[] = []
  const max = Math.min(count, pool.length)
  for (let i = 0; i < max; i += 1) {
    const index = Math.floor(Math.random() * pool.length)
    selected.push(pool.splice(index, 1)[0])
  }
  return selected
}

const buildUserContext = (forceNew = false) => {
  const key = forceNew ? createUserKey() : getUserKey()
  const state = pickRandom(US_STATES)
  const ownedPlatforms = pickUnique(
    OWNED_PLATFORMS,
    Math.floor(Math.random() * 3) + 1
  )
  return {
    kind: 'user',
    key,
    anonymous: false,
    name: 'Launchpad Demo User',
    email: `demo.user+${key.slice(-6)}@launchpad.games`,
    plan: 'party',
    region: 'NA',
    state,
    owned_platforms: ownedPlatforms,
    device: 'mobile',
    platform: 'web'
  }
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

  const context = ref(buildUserContext())

  // Client-only initialization; keeps flags ready for composables.
  ldClient = initialize(clientId, context.value)
  await ldClient.waitForInitialization()
  isReady.value = true
  if (import.meta.dev) {
    console.info('[LaunchDarkly] Client initialized', { key: context.value.key })
  }

  return {
    provide: {
      launchDarkly: {
        client: ldClient,
        isReady,
        context,
        createUserContext: (forceNew = false) => buildUserContext(forceNew),
        setContext: async (nextContext: ReturnType<typeof buildUserContext>) => {
          if (!ldClient) return
          await ldClient.identify(nextContext)
          context.value = nextContext
        }
      }
    }
  }
})
