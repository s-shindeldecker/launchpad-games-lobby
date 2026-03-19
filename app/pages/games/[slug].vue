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
          class="font-gameBody mt-8 rounded-3xl border-2 border-amber-400/60 bg-slate-900/80 p-6 shadow-xl shadow-amber-500/10"
        >
          <div class="flex flex-wrap items-center gap-3">
            <p class="font-game text-sm uppercase tracking-wider text-amber-300">
              Talkin’ Ship (AI Judge Edition)
            </p>
            <span
              v-if="showJudgeResults"
              class="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-200"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
              Judge View
              <span class="text-amber-200/50">(⌘J)</span>
            </span>
          </div>
          <h2 class="font-game mt-3 text-xl text-white drop-shadow-sm">
            Try a ship‑pun challenge
          </h2>
          <p class="mt-2 text-sm text-slate-200/90">
            Get a prompt, drop your best ship‑related pun, and let the AI judge
            score it.
          </p>

          <div class="mt-5 flex flex-col gap-4 lg:flex-row">
            <div
              :class="[
                'relative flex-1 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-amber-950/30 p-4 shadow-inner',
                showJudgeResults && promptJudges.length ? '' : 'lg:flex-[1_1_100%]'
              ]"
            >
              <div
                v-if="isBusy"
                class="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-amber-400/10 via-amber-200/20 to-amber-400/10"
              ></div>
              <p class="font-game text-xs uppercase tracking-wider text-amber-300">
                Challenge
              </p>
              <p
                v-if="prompt"
                class="mt-2 text-base font-medium leading-snug text-amber-100"
              >
                {{ prompt }}
              </p>
              <p v-else class="mt-2 text-sm text-amber-200/70">
                Click "Start Round" to get a prompt.
              </p>
            </div>
            <div
              v-if="showJudgeResults && promptJudges.length"
              class="flex flex-1 flex-col gap-3 lg:max-w-xs"
            >
              <div
                v-for="judge in promptJudges"
                :key="judge.metricKey"
                class="rounded-2xl border-2 border-amber-400/30 bg-white/5 p-4 transition-all"
              >
                <p class="font-game text-xs uppercase tracking-wider text-amber-300">
                  {{ judge.metricKey }}
                </p>
                <p class="mt-2 text-sm font-medium text-amber-100">
                  Score: {{ formatJudgeScore(judge.score) }}
                </p>
                <p
                  v-if="judge.reasoning"
                  class="mt-2 text-xs leading-relaxed text-slate-400"
                >
                  {{ judge.reasoning }}
                </p>
              </div>
              <div
                v-if="promptFallbackUsed"
                class="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-100"
              >
                Prompt fallback applied.
              </div>
            </div>
          </div>

          <div class="mt-4">
            <textarea
              v-model="response"
              rows="3"
              class="w-full rounded-2xl border-2 border-amber-400/40 bg-slate-950/70 px-4 py-3 text-sm text-amber-50 placeholder:text-amber-200/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              :placeholder="prompt ? 'Your ship pun goes here…' : 'Get a prompt first'"
              :disabled="!prompt || isBusy"
            ></textarea>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              class="rounded-full border-2 border-amber-400/60 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 hover:border-amber-400/80 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isBusy"
              @click="startRound"
            >
              {{ prompt ? 'New Prompt' : 'Start Round' }}
            </button>
            <button
              class="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!prompt || !response.trim() || isBusy"
              @click="submitResponse"
            >
              Submit Response
            </button>
            <button
              v-if="hasAnyJudgeResults"
              :class="[
                'ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                showJudgeResults
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
                  : 'border-white/15 text-slate-400 hover:border-amber-400/40 hover:text-amber-200'
              ]"
              @click="showJudgeResults = !showJudgeResults"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                <path v-if="showJudgeResults" d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path v-if="showJudgeResults" fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd" />
                <path v-if="!showJudgeResults" fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.092 1.092a4 4 0 0 0-5.558-5.558Z" clip-rule="evenodd" />
                <path v-if="!showJudgeResults" d="M10.748 13.93 8.016 11.2A2.501 2.501 0 0 0 10.748 13.93ZM7.4 12.658l-3.535-3.535A10.047 10.047 0 0 0 .663 10.598a1.651 1.651 0 0 0 0 1.186A10.004 10.004 0 0 0 10 17c.9 0 1.778-.119 2.612-.34L7.4 12.66Z" />
              </svg>
              {{ showJudgeResults ? 'Hide' : 'Show' }} Judges
            </button>
          </div>
          <div
            v-if="isBusy"
            class="mt-3 flex items-center gap-2 text-xs text-amber-200"
          >
            <span class="h-2 w-2 animate-pulse rounded-full bg-amber-300"></span>
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-amber-300 [animation-delay:150ms]"
            ></span>
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-amber-300 [animation-delay:300ms]"
            ></span>
            <span class="uppercase tracking-wider">Thinking</span>
          </div>

          <p v-if="errorMessage" class="mt-3 text-xs text-rose-300">
            {{ errorMessage }}
          </p>

          <div
            v-if="result || isBusy"
            class="mt-5 flex flex-col gap-4 lg:flex-row"
          >
            <div
              v-if="result"
              :class="[
                'relative flex-1 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-slate-950/70 p-4 shadow-inner',
                showJudgeResults && responseJudges.length ? '' : 'lg:flex-[1_1_100%]'
              ]"
            >
              <div
                v-if="isBusy"
                class="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-amber-400/10 via-amber-200/20 to-amber-400/10"
              ></div>
              <div class="flex flex-wrap items-center gap-3">
                <span
                  class="rounded-full border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-wider text-amber-200"
                >
                  Score
                </span>
                <span
                  class="font-game text-3xl font-semibold text-amber-100 drop-shadow-sm"
                >
                  {{ result.score }}
                </span>
              </div>
              <p
                class="mt-2 text-base font-medium"
                :class="verdictColorClass(result.score)"
              >
                {{ result.verdict }}
              </p>
              <p v-if="result.comment" class="mt-2 text-sm text-slate-300">
                {{ result.comment }}
              </p>
              <div
                v-if="result.meta"
                class="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"
              >
                <span v-if="result.meta.stopReason">
                  Stop: {{ result.meta.stopReason }}
                </span>
                <span v-if="result.meta.usage">
                  Tokens: {{ formatUsage(result.meta.usage) }}
                </span>
              </div>
            </div>
            <div
              v-else-if="isBusy"
              class="relative flex-1 overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-slate-950/70 p-4 shadow-inner"
            >
              <div
                class="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-amber-400/10 via-amber-200/20 to-amber-400/10"
              ></div>
              <div class="flex flex-wrap items-center gap-3">
                <span
                  class="rounded-full border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-wider text-amber-200"
                >
                  Score
                </span>
                <span class="font-game text-3xl font-semibold text-amber-100">
                  —
                </span>
                <span class="text-xs uppercase tracking-wider text-amber-300">
                  Loading
                </span>
              </div>
              <div class="mt-3 space-y-2">
                <div class="h-3 w-3/4 rounded-full bg-amber-200/20"></div>
                <div class="h-3 w-2/3 rounded-full bg-amber-200/10"></div>
              </div>
            </div>
            <div
              v-if="showJudgeResults && responseJudges.length"
              class="flex flex-1 flex-col gap-3 lg:max-w-xs"
            >
              <div
                v-for="judge in responseJudges"
                :key="judge.metricKey"
                class="rounded-2xl border-2 border-amber-400/30 bg-white/5 p-4 transition-all"
              >
                <p class="font-game text-xs uppercase tracking-wider text-amber-300">
                  {{ judge.metricKey }}
                </p>
                <p class="mt-2 text-sm font-medium text-amber-100">
                  Score: {{ formatJudgeScore(judge.score) }}
                </p>
                <p
                  v-if="judge.reasoning"
                  class="mt-2 text-xs leading-relaxed text-slate-400"
                >
                  {{ judge.reasoning }}
                </p>
              </div>
              <div
                v-if="responseFallbackUsed"
                class="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-100"
              >
                Response judge fallback applied.
              </div>
            </div>
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
      <div
        v-if="showAiJudge && isDebugOpen"
        class="fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl border border-amber-400/40 bg-slate-950/95 p-4 text-xs text-slate-200 shadow-2xl"
      >
        <div class="flex items-center justify-between">
          <p class="font-game text-xs uppercase tracking-wider text-amber-300">
            Debug Console
          </p>
          <button
            class="rounded-full border border-amber-400/40 px-2 py-1 text-[10px] text-amber-100 transition hover:border-amber-300 hover:text-amber-50"
            @click="isDebugOpen = false"
          >
            Close
          </button>
        </div>
        <div class="mt-3 space-y-3">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-amber-200/80">
              Client logs
            </p>
            <div
              class="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2"
            >
              <p v-if="!clientLogs.length" class="text-[10px] text-slate-400">
                No client logs yet.
              </p>
              <div
                v-for="(entry, index) in clientLogs"
                :key="`client-${index}`"
                class="space-y-1 text-[10px]"
              >
                <p class="text-slate-500">
                  {{ entry.ts }}
                  <span class="uppercase tracking-wider text-amber-200/80">
                    {{ entry.level }}
                  </span>
                </p>
                <p class="text-slate-200">{{ entry.message }}</p>
              </div>
            </div>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-amber-200/80">
              Server logs
            </p>
            <div
              class="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2"
            >
              <p v-if="!serverLogs.length" class="text-[10px] text-slate-400">
                No server logs yet.
              </p>
              <div
                v-for="(entry, index) in serverLogs"
                :key="`server-${index}`"
                class="space-y-1 text-[10px]"
              >
                <p class="text-slate-500">
                  {{ entry.ts }}
                  <span class="uppercase tracking-wider text-amber-200/80">
                    {{ entry.level }}
                  </span>
                </p>
                <p class="text-slate-200">{{ entry.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { trackEvent } from '~/utils/analytics'
import { useLaunchDarkly } from '~/composables/useLaunchDarkly'
import { useCart } from '~/composables/useCart'

const route = useRoute()
const { $launchDarkly, $debugLogs } = useNuxtApp()
const lastTrackedSlug = ref<string | null>(null)
const { getFlagValue, isReady } = useLaunchDarkly()
const pdpLargeImages = ref(false)
const { addItem, openDrawer } = useCart()
const aiJudgeEnabled = ref(true)
const promptTone = ref('playful')
const prompt = ref('')
const response = ref('')
const result = ref<
  | null
  | {
      score: number
      label: string
      verdict: string
      comment?: string
      meta?: {
        stopReason?: string
        usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
      }
      judge?: {
        metricKey: string
        score: number
        reasoning: string
      }
    }
>(null)
const isBusy = ref(false)
const errorMessage = ref('')
const isDebugOpen = ref(false)
const showJudgeResults = ref(false)

type DebugLogEntry = {
  ts: string
  level: string
  message: string
}

const clientLogs = computed<DebugLogEntry[]>(
  () => ($debugLogs?.logs?.value as DebugLogEntry[]) ?? []
)
const serverLogs = ref<DebugLogEntry[]>([])
let serverLogTimer: ReturnType<typeof setInterval> | null = null

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
  verdict: 'Not bad—try another!',
  comment: 'Short, sharp, and seaworthy. Keep it up.'
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

const fetchServerLogs = async () => {
  try {
    const response = await $fetch('/api/debug-logs')
    if (response && typeof response === 'object' && 'logs' in response) {
      const payload = response as { logs?: DebugLogEntry[] }
      serverLogs.value = payload.logs ?? []
    }
  } catch {
    // Ignore debug polling errors.
  }
}

watch(isDebugOpen, (isOpen) => {
  if (isOpen) {
    void fetchServerLogs()
    if (!serverLogTimer) {
      serverLogTimer = setInterval(fetchServerLogs, 3000)
    }
  } else if (serverLogTimer) {
    clearInterval(serverLogTimer)
    serverLogTimer = null
  }
})

const handleDebugHotkey = (event: KeyboardEvent) => {
  if (!showAiJudge.value) return
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault()
    isDebugOpen.value = !isDebugOpen.value
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
    event.preventDefault()
    showJudgeResults.value = !showJudgeResults.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleDebugHotkey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleDebugHotkey)
  if (serverLogTimer) {
    clearInterval(serverLogTimer)
    serverLogTimer = null
  }
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

const parseJudgeString = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('```')) return null
  try {
    const cleaned = trimmed.startsWith('```')
      ? trimmed
          .split('\n')
          .slice(1, -1)
          .join('\n')
          .trim()
      : trimmed
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object') {
      return parsed as {
        score?: unknown
        label?: unknown
        verdict?: unknown
        comment?: unknown
      }
    }
  } catch {
    return null
  }
  return null
}

type JudgeDisplay = {
  metricKey: string
  score: number
  reasoning: string
}

const normalizeJudgeDisplay = (value: unknown): JudgeDisplay | null => {
  if (!value || typeof value !== 'object') return null
  const payload = value as { metricKey?: unknown; score?: unknown; reasoning?: unknown }
  if (typeof payload.metricKey !== 'string' || typeof payload.score !== 'number') {
    return null
  }
  return {
    metricKey: payload.metricKey,
    score: payload.score,
    reasoning: typeof payload.reasoning === 'string' ? payload.reasoning : ''
  }
}

const normalizeJudge = (value: unknown) => {
  if (!value || typeof value !== 'object') return fallbackJudge
  const payload = value as {
    score?: unknown
    label?: unknown
    verdict?: unknown
    comment?: unknown
    meta?: unknown
    judge?: unknown
  }
  const score =
    typeof payload.score === 'number' ? Math.round(payload.score) : fallbackJudge.score
  const label =
    typeof payload.label === 'string' ? payload.label : fallbackJudge.label
  let verdict =
    typeof payload.verdict === 'string' ? payload.verdict : fallbackJudge.verdict
  let comment =
    typeof payload.comment === 'string' ? payload.comment : undefined

  if (verdict) {
    const parsed = parseJudgeString(verdict)
    if (parsed) {
      if (typeof parsed.verdict === 'string') verdict = parsed.verdict
      if (typeof parsed.comment === 'string') comment = parsed.comment
    }
  }
  const meta = payload.meta as
    | {
        stopReason?: unknown
        usage?: unknown
      }
    | undefined
  const metaNormalized =
    meta && typeof meta === 'object'
      ? {
          stopReason:
            typeof meta.stopReason === 'string' ? meta.stopReason : undefined,
          usage:
            meta.usage && typeof meta.usage === 'object'
              ? (meta.usage as {
                  inputTokens?: number
                  outputTokens?: number
                  totalTokens?: number
                })
              : undefined
        }
      : undefined
  return {
    score,
    label,
    verdict,
    comment,
    meta: metaNormalized,
    judge: normalizeJudgeDisplay(payload.judge)
  }
}

const formatUsage = (usage: {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}) => {
  const parts: string[] = []
  if (typeof usage.inputTokens === 'number') {
    parts.push(`in ${usage.inputTokens}`)
  }
  if (typeof usage.outputTokens === 'number') {
    parts.push(`out ${usage.outputTokens}`)
  }
  if (typeof usage.totalTokens === 'number') {
    parts.push(`total ${usage.totalTokens}`)
  }
  return parts.join(' · ')
}

const formatJudgeScore = (score: number) => {
  if (Number.isNaN(score)) return 'n/a'
  return `${Math.round(score * 100)}%`
}

const verdictColorClass = (score: number) => {
  if (score >= 80) return 'text-emerald-200'
  if (score >= 50) return 'text-amber-200'
  return 'text-amber-100'
}

const promptJudges = ref<JudgeDisplay[]>([])
const responseJudges = ref<JudgeDisplay[]>([])
const promptFallbackUsed = ref(false)
const responseFallbackUsed = ref(false)

const hasAnyJudgeResults = computed(
  () => promptJudges.value.length > 0 || responseJudges.value.length > 0
)

const collectJudges = (source: unknown): JudgeDisplay[] => {
  if (!source || typeof source !== 'object') return []
  if (Array.isArray(source)) {
    return source.map(normalizeJudgeDisplay).filter((j): j is JudgeDisplay => j !== null)
  }
  const single = normalizeJudgeDisplay(source)
  return single ? [single] : []
}

const startRound = async () => {
  errorMessage.value = ''
  result.value = null
  response.value = ''
  promptJudges.value = []
  responseJudges.value = []
  promptFallbackUsed.value = false
  responseFallbackUsed.value = false
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
    if (output && typeof output === 'object') {
      const obj = output as { judge?: unknown; judges?: unknown }
      promptJudges.value = collectJudges(obj.judges ?? obj.judge)
    }
    if (output && typeof output === 'object' && 'fallback' in output) {
      const fallback = (output as { fallback?: unknown }).fallback
      if (fallback && typeof fallback === 'object') {
        promptFallbackUsed.value = Boolean(
          (fallback as { prompt?: unknown }).prompt
        )
      }
    }
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
    const normalized = normalizeJudge(output)
    result.value = normalized
    if (output && typeof output === 'object') {
      const obj = output as { judges?: unknown }
      if (obj.judges) {
        responseJudges.value = collectJudges(obj.judges)
      } else {
        responseJudges.value = normalized.judge ? [normalized.judge] : []
      }
    }
    if (output && typeof output === 'object' && 'fallback' in output) {
      const fallback = (output as { fallback?: unknown }).fallback
      if (fallback && typeof fallback === 'object') {
        responseFallbackUsed.value = Boolean(
          (fallback as { judge?: unknown }).judge
        )
      }
    }
  } catch {
    result.value = fallbackJudge
    errorMessage.value = 'Judge unavailable. Showing a fallback verdict.'
  } finally {
    isBusy.value = false
  }
}
</script>
