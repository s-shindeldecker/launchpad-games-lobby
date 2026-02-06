<template>
  <div class="px-6 pb-16 pt-10">
    <section class="mx-auto flex max-w-6xl flex-col gap-10">
      <div>
        <NuxtLink
          to="/games"
          class="inline-flex items-center gap-2 text-xs text-slate-300 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back to games
        </NuxtLink>
      </div>
      <div
        class="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/60"
      >
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-fuchsia-200">
              {{ game.pack }}
            </p>
            <h1 class="mt-3 text-4xl font-semibold sm:text-5xl">
              {{ game.name }}
            </h1>
            <p class="mt-3 max-w-2xl text-base text-slate-200/90">
              {{ game.tagline }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p class="text-xs text-slate-400">Players</p>
            <p class="text-sm text-white">{{ game.players }}</p>
            <p class="mt-2 text-xs text-slate-400">Platforms</p>
            <p class="text-sm text-white">{{ game.platforms.join(' · ') }}</p>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3 text-xs text-white/80">
          <span
            v-for="badge in game.badges"
            :key="badge"
            class="rounded-full border border-white/10 px-3 py-1"
          >
            {{ badge }}
          </span>
        </div>

        <div
          v-if="game.image"
          class="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60"
        >
          <img
            :src="game.image"
            :alt="game.name"
            :class="[
              'h-auto w-full object-contain',
              pdpLargeImages ? 'max-h-[520px]' : 'max-h-[360px]'
            ]"
          />
        </div>

        <div
          v-if="showAiJudge"
          class="mt-8 rounded-3xl border border-white/10 bg-slate-900/50 p-6"
        >
          <p class="text-xs uppercase tracking-[0.3em] text-fuchsia-200">
            Talkin’ Ship (AI Judge Edition)
          </p>
          <h2 class="mt-3 text-lg font-semibold text-white">
            Try a ship‑pun challenge
          </h2>
          <p class="mt-2 text-sm text-slate-200/90">
            Get a prompt, drop your best ship‑related pun, and let the AI judge
            score it.
          </p>

          <div class="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs text-slate-400">Prompt</p>
            <p v-if="prompt" class="mt-2 text-sm text-white">
              {{ prompt }}
            </p>
            <p v-else class="mt-2 text-sm text-slate-400">
              Click “Start Round” to get a prompt.
            </p>
          </div>

          <div class="mt-4">
            <textarea
              v-model="response"
              rows="3"
              class="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none"
              :placeholder="prompt ? 'Your ship pun goes here…' : 'Get a prompt first'"
              :disabled="!prompt || isBusy"
            ></textarea>
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <button
              class="rounded-full border border-fuchsia-400/40 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isBusy"
              @click="startRound"
            >
              {{ prompt ? 'New Prompt' : 'Start Round' }}
            </button>
            <button
              class="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!prompt || !response.trim() || isBusy"
              @click="submitResponse"
            >
              Submit Response
            </button>
          </div>

          <p v-if="errorMessage" class="mt-3 text-xs text-rose-300">
            {{ errorMessage }}
          </p>

          <div
            v-if="result"
            class="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
          >
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Score</span>
              <span>{{ result.score }} · {{ result.label.toUpperCase() }}</span>
            </div>
            <p class="mt-2 text-sm text-white">{{ result.verdict }}</p>
          </div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold text-white">What to Expect</h2>
            <ul class="mt-4 space-y-3 text-sm text-slate-200/90">
              <li v-for="item in game.highlights" :key="item">• {{ item }}</li>
            </ul>
          </div>
          <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold text-white">Buy the Party Game</h2>
            <p class="mt-2 text-sm text-slate-300">
              Available now from your favorite store.
            </p>
            <button
              class="mt-4 w-full rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
              @click="handleAddToCart"
            >
              Add to Cart
            </button>
            <div class="mt-4 flex flex-col gap-3">
              <a
                v-for="link in game.storeLinks"
                :key="link.label"
                :href="link.url"
                target="_blank"
                rel="noreferrer"
                class="rounded-full border border-white/10 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
              >
                {{ link.label }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <h2 class="text-lg font-semibold text-white">More from Launchpad</h2>
        <p class="mt-2 text-sm text-slate-300">
          Explore the full lineup on the games list page.
        </p>
        <NuxtLink
          to="/games"
          class="mt-4 inline-flex items-center gap-2 text-sm text-fuchsia-200"
        >
          Back to games
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { trackEvent } from '~/utils/analytics'
import { useLaunchDarkly } from '~/composables/useLaunchDarkly'
import { useCart } from '~/composables/useCart'

const route = useRoute()
const { $launchDarkly } = useNuxtApp()
const lastTrackedSlug = ref<string | null>(null)
const { getFlagValue, isReady } = useLaunchDarkly()
const pdpLargeImages = ref(false)
const { addItem, openDrawer } = useCart()
const aiJudgeEnabled = ref(true)
const promptTone = ref('playful')
const prompt = ref('')
const response = ref('')
const result = ref<null | { score: number; label: string; verdict: string }>(
  null
)
const isBusy = ref(false)
const errorMessage = ref('')

const isTalkinShip = computed(
  () => route.params.slug === 'talkin-ship'
)
const showAiJudge = computed(() => aiJudgeEnabled.value && isTalkinShip.value)

const fallbackPrompts = [
  'A pirate is interviewing for a corporate job. What’s their ship‑pun answer to “Where do you see yourself in 5 years?”',
  'A cruise ship has to give a pep talk before the big race. What’s the ship‑pun opener?',
  'A lighthouse starts a podcast. What’s the ship‑pun title of episode one?'
]

const fallbackJudge = {
  score: 50,
  label: 'ok',
  verdict: 'Not bad—try another!'
}

const buildContextPayload = () => {
  const context = $launchDarkly?.context?.value
  if (!context) return undefined
  return {
    key: context.key,
    anonymous: context.anonymous,
    name: context.name,
    state: context.state,
    owned_platforms: context.owned_platforms,
    region: context.region,
    plan: context.plan,
    device: context.device,
    platform: context.platform
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    const productId = Array.isArray(slug) ? slug[0] : slug
    if (!productId || productId === lastTrackedSlug.value) return
    lastTrackedSlug.value = productId
    // Exposure denominator for PDP experiments.
    trackEvent('pdp_view', { product_id: productId })
  },
  { immediate: true }
)

watchEffect(() => {
  if (!isReady.value) return
  pdpLargeImages.value = getFlagValue('plp-large-images', pdpLargeImages.value)
  aiJudgeEnabled.value = getFlagValue('ai-judge-enabled', true)
  promptTone.value = getFlagValue('ai-prompt-variant', 'playful')
})

const detailedGames = {
  'talkin-ship': {
    name: "Talkin' Ship",
    pack: 'Party Game Collection',
    tagline:
      'A quick-paced, witty party game where every round demands a ship pun.',
    players: '3-8 players',
    badges: ['Wordplay', 'Fast', 'Witty'],
    platforms: ['Steam', 'Switch', 'PS5', 'Xbox'],
    image: '/images/talkin-ship.png',
    highlights: [
      'Beat your friends to the cleverest ship-related pun for each scenario.',
      'Lightning rounds reward speed, charm, and perfectly cheesy delivery.',
      'Crowd prompts keep the room roaring and the jokes escalating.'
    ],
    storeLinks: [
      { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
      { label: 'Buy on PlayStation', url: 'https://store.playstation.com/' },
      { label: 'Buy on Xbox', url: 'https://www.xbox.com/' }
    ]
  },
  'laugh-labyrinth': {
    name: 'Laugh Labyrinth',
    pack: 'Party Game Collection',
    tagline: 'Co-op puzzle rooms for the most chaotic of friends.',
    players: '1-6 players',
    badges: ['Co-op', 'Puzzle', 'Timers'],
    platforms: ['Steam', 'Switch', 'Web'],
    image: '/images/laugh-labyrinth.png',
    highlights: [
      'Solve riddles together before the lab collapses.',
      'Swap roles mid-round to keep the crew coordinated.',
      'Shared screen chaos with quickfire bonus puzzles.'
    ],
    storeLinks: [
      { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
      { label: 'Buy on Nintendo', url: 'https://www.nintendo.com/store/' },
      { label: 'Buy on Web', url: 'https://launchpad.games/' }
    ]
  },
  'tag-it-toggle-it': {
    name: "Tag it & Toggle it",
    pack: 'Party Game Collection',
    tagline:
      'Create two or more versions of your graffiti art, then toggle into the funniest phrase.',
    players: '3-8 players',
    badges: ['Creative', 'Mashup', 'Party'],
    platforms: ['Steam', 'Switch', 'Web'],
    image: '/images/tag-it-toggle-it.png',
    highlights: [
      'Sketch two takes on the same concept, then flip between them on the fly.',
      'Combine quick tags into surprisingly clever or off-beat sayings.',
      'Fast rounds keep the energy high and the laughs constant.'
    ],
    storeLinks: [
      { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
      { label: 'Buy on Nintendo', url: 'https://www.nintendo.com/store/' },
      { label: 'Buy on Web', url: 'https://launchpad.games/' }
    ]
  },
  'tavern-games': {
    name: 'Tavern Games',
    pack: 'Party Game Collection',
    tagline:
      'Can you beat the fantastical creatures at this tavern in games from their own magical world?',
    players: '2-8 players',
    badges: ['Fantasy', 'Challenge', 'Party'],
    platforms: ['Steam', 'Switch', 'Web'],
    image: '/images/tavern-games.png',
    highlights: [
      'Challenge a rowdy cast of magical locals in rotating tavern contests — including crowd favorites like Mittens, the game no one fully understands but everyone insists is “very traditional.”',
      'Bounce between rounds of luck, skill, and quickfire storytelling, capped off with a red potion drinking contest that absolutely has no long-term side effects. Probably.',
      'Perform for a wildly opinionated audience of 50,000 roaring orcs, who will reward brilliance with thunderous cheers and punish hesitation with immediate, unforgettable jeers.'
    ],
    storeLinks: [
      { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
      { label: 'Buy on Nintendo', url: 'https://www.nintendo.com/store/' },
      { label: 'Buy on Web', url: 'https://launchpad.games/' }
    ]
  },
  'blastbeat-battle': {
    name: 'Blastbeat Battle',
    pack: 'Party Game Collection',
    tagline: 'Rhythm duels and crowd-surfing mini-games.',
    players: '2-10 players',
    badges: ['Rhythm', 'Party', 'Fast'],
    platforms: ['Steam', 'PS5', 'Xbox'],
    image: '/images/blastbeat-battle.png',
    highlights: [
      'Sync to the beat or get launched off the stage.',
      'Quickfire rounds keep the party energy high.',
      'Bonus encore modes for late-night marathons.'
    ],
    storeLinks: [
      { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
      { label: 'Buy on PlayStation', url: 'https://store.playstation.com/' },
      { label: 'Buy on Xbox', url: 'https://www.xbox.com/' }
    ]
  }
}

const game = computed(
  () =>
    detailedGames[route.params.slug as keyof typeof detailedGames] ?? {
      name: 'Coming Soon',
      pack: 'Upcoming Party Game',
      tagline: 'Details are still in orbit. Check back soon for the full reveal.',
      players: 'TBD',
      badges: ['TBD'],
      platforms: ['TBD'],
      image: '',
      highlights: [
        'This game is still incubating inside the Launchpad labs.',
        'More details will appear as soon as the party game is announced.'
      ],
      storeLinks: [{ label: 'View all games', url: '/games' }]
    }
)

const handleAddToCart = () => {
  const productId = Array.isArray(route.params.slug)
    ? route.params.slug[0]
    : (route.params.slug as string)
  if (!productId) return
  addItem({ id: productId, name: game.value.name })
  openDrawer()
  trackEvent('add_to_cart', { product_id: productId, purchase_type: 'direct' })
}

const normalizePrompt = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'prompt' in value) {
    const promptValue = (value as { prompt?: unknown }).prompt
    if (typeof promptValue === 'string') return promptValue
  }
  return ''
}

const normalizeJudge = (value: unknown) => {
  if (!value || typeof value !== 'object') return fallbackJudge
  const payload = value as {
    score?: unknown
    label?: unknown
    verdict?: unknown
  }
  const score =
    typeof payload.score === 'number' ? Math.round(payload.score) : fallbackJudge.score
  const label =
    typeof payload.label === 'string' ? payload.label : fallbackJudge.label
  const verdict =
    typeof payload.verdict === 'string' ? payload.verdict : fallbackJudge.verdict
  return { score, label, verdict }
}

const startRound = async () => {
  errorMessage.value = ''
  result.value = null
  response.value = ''
  isBusy.value = true
  try {
    const output = await $fetch('/api/ai-config', {
      method: 'POST',
      body: {
        type: 'prompt',
        input: { tone: promptTone.value, length: 'short' },
        context: buildContextPayload()
      }
    })
    const nextPrompt = normalizePrompt(output)
    prompt.value =
      nextPrompt || fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]
  } catch {
    prompt.value = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]
    errorMessage.value = 'Prompt generator unavailable. Using a fallback prompt.'
  } finally {
    isBusy.value = false
  }
}

const submitResponse = async () => {
  if (!prompt.value || !response.value.trim()) return
  errorMessage.value = ''
  isBusy.value = true
  try {
    const output = await $fetch('/api/ai-config', {
      method: 'POST',
      body: {
        type: 'judge',
        input: { prompt: prompt.value, response: response.value.trim() },
        context: buildContextPayload()
      }
    })
    result.value = normalizeJudge(output)
  } catch {
    result.value = fallbackJudge
    errorMessage.value = 'Judge unavailable. Showing a fallback verdict.'
  } finally {
    isBusy.value = false
  }
}
</script>
