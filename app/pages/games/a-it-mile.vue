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
            <p class="text-xs uppercase tracking-[0.3em] text-violet-200">
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
            class="h-auto max-h-[360px] w-full object-contain"
          />
        </div>

        <div
          class="font-gameBody mt-8 rounded-3xl border-2 border-violet-400/60 bg-slate-900/80 p-6 shadow-xl shadow-violet-500/10"
        >
          <div class="flex flex-wrap items-center gap-3">
            <p class="font-game text-sm uppercase tracking-wider text-violet-300">
              AI-t Mile (AI Battle)
            </p>
            <span
              v-if="showJudgeResults"
              class="inline-flex items-center gap-1.5 rounded-full border border-violet-400/50 bg-violet-400/15 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-violet-200"
            >
              <span
                class="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50"
              ></span>
              Judge View
              <span class="text-violet-200/50">(⌘J)</span>
            </span>
          </div>
          <h2 class="font-game mt-3 text-xl text-white drop-shadow-sm">
            Battle the AI on the mic
          </h2>
          <p class="mt-2 text-sm text-slate-200/90">
            Get a topic and the AI&apos;s opening bars, drop your response, and
            see who wins the round.
          </p>

          <div class="mt-5 flex flex-col gap-4 lg:flex-row">
            <div
              :class="[
                'relative flex-1 overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-violet-950/30 p-4 shadow-inner',
                showJudgeResults && roundJudges.length ? '' : 'lg:flex-[1_1_100%]'
              ]"
            >
              <div
                v-if="isBusy && !topic"
                class="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-violet-400/10 via-violet-200/20 to-violet-400/10"
              ></div>
              <p class="font-game text-xs uppercase tracking-wider text-violet-300">
                Challenge
              </p>
              <p
                v-if="topic"
                class="mt-2 text-base font-medium leading-snug text-violet-100"
              >
                The topic is: {{ topic }}
              </p>
              <p v-else class="mt-2 text-sm text-violet-200/70">
                Click &quot;Start Round&quot; to get a topic and AI bars.
              </p>
              <div v-if="aiBars" class="mt-4">
                <p class="font-game text-xs uppercase tracking-wider text-violet-300">
                  AI opening bars
                </p>
                <p class="mt-2 text-sm leading-relaxed text-violet-100/95">
                  <span v-html="normalizeLineBreaks(aiBars)"></span>
                </p>
              </div>
              <div
                v-if="promptFallbackUsed"
                class="mt-4 rounded-lg border border-violet-400/40 bg-violet-400/10 px-2 py-1 text-[10px] text-violet-100"
              >
                Prompt fallback applied.
              </div>
            </div>
            <div
              v-if="showJudgeResults && roundJudges.length"
              class="flex flex-1 flex-col gap-3 lg:max-w-xs"
            >
              <div
                v-for="judge in roundJudges"
                :key="judge.metricKey"
                class="rounded-2xl border-2 border-violet-400/30 bg-white/5 p-4 transition-all"
              >
                <p class="font-game text-xs uppercase tracking-wider text-violet-300">
                  {{ judge.metricKey }}
                </p>
                <p class="mt-2 text-sm font-medium text-violet-100">
                  Score: {{ formatJudgeScore(judge.score) }}
                </p>
                <p
                  v-if="judge.reasoning"
                  class="mt-2 text-xs leading-relaxed text-slate-400"
                >
                  <span v-html="normalizeLineBreaks(judge.reasoning)"></span>
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <textarea
              v-model="response"
              rows="4"
              class="w-full rounded-2xl border-2 border-violet-400/40 bg-slate-950/70 px-4 py-3 text-sm text-violet-50 placeholder:text-violet-200/50 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
              :placeholder="
                topic ? 'Drop your bars here…' : 'Start a round to get the topic first'
              "
              :disabled="!topic || isBusy"
            ></textarea>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              class="rounded-full border-2 border-violet-400/60 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:border-violet-400/80 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isBusy"
              @click="startRound"
            >
              {{ topic ? 'New Round' : 'Start Round' }}
            </button>
            <button
              class="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!topic || !response.trim() || isBusy"
              @click="submitResponse"
            >
              Submit Response
            </button>
            <button
              v-if="hasAnyJudgeResults"
              :class="[
                'ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                showJudgeResults
                  ? 'border-violet-400/60 bg-violet-400/15 text-violet-200 hover:bg-violet-400/25'
                  : 'border-white/15 text-slate-400 hover:border-violet-400/40 hover:text-violet-200'
              ]"
              @click="showJudgeResults = !showJudgeResults"
            >
              {{ showJudgeResults ? 'Hide' : 'Show' }} Judges
            </button>
          </div>

          <div
            v-if="isBusy"
            class="mt-3 flex items-center gap-2 text-xs text-violet-200"
          >
            <span class="h-2 w-2 animate-pulse rounded-full bg-violet-300"></span>
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-violet-300 [animation-delay:150ms]"
            ></span>
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-violet-300 [animation-delay:300ms]"
            ></span>
            <span class="uppercase tracking-wider">Thinking</span>
          </div>

          <p v-if="errorMessage" class="mt-3 text-xs text-rose-300">
            {{ errorMessage }}
          </p>

          <div
            v-if="result || (isBusy && topic)"
            class="mt-5 flex flex-col gap-4 lg:flex-row"
          >
            <div
              v-if="result"
              :class="[
                'relative flex-1 overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-950/70 p-4 shadow-inner',
                showJudgeResults && responseJudges.length ? '' : 'lg:flex-[1_1_100%]'
              ]"
            >
              <div class="flex flex-wrap items-center gap-3">
                <span
                  class="rounded-full border border-violet-300/60 bg-violet-300/10 px-3 py-1 text-xs uppercase tracking-wider text-violet-200"
                >
                  Score
                </span>
                <span
                  class="font-game text-3xl font-semibold drop-shadow-sm"
                  :class="scoreColorClass(result.score)"
                >
                  {{ result.score }}
                </span>
              </div>
              <p
                v-if="winnerHeadline"
                class="mt-3 text-lg font-semibold text-violet-100"
              >
                {{ winnerHeadline }}
              </p>
              <p
                v-if="result.verdict"
                class="mt-2 text-base font-medium"
                :class="scoreColorClass(result.score)"
              >
                {{ result.verdict }}
              </p>
              <div v-if="result.comment" class="mt-3">
                <p class="font-game text-xs uppercase tracking-wider text-violet-300">
                  AI comeback
                </p>
                <p class="mt-2 text-sm leading-relaxed text-slate-300">
                  <span v-html="normalizeLineBreaks(result.comment)"></span>
                </p>
              </div>
              <div
                v-if="result.meta?.usage"
                class="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"
              >
                <span>Tokens: {{ formatUsage(result.meta.usage) }}</span>
              </div>
              <div
                v-if="judgeFallbackUsed"
                class="mt-4 rounded-lg border border-violet-400/40 bg-violet-400/10 px-2 py-1 text-[10px] text-violet-100"
              >
                Judge fallback applied.
              </div>
            </div>
            <div
              v-else-if="isBusy && topic"
              class="relative flex-1 overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-950/70 p-4 shadow-inner"
            >
              <div
                class="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-violet-400/10 via-violet-200/20 to-violet-400/10"
              ></div>
              <div class="flex flex-wrap items-center gap-3">
                <span
                  class="rounded-full border border-violet-300/60 bg-violet-300/10 px-3 py-1 text-xs uppercase tracking-wider text-violet-200"
                >
                  Score
                </span>
                <span class="font-game text-3xl font-semibold text-violet-100">—</span>
                <span class="text-xs uppercase tracking-wider text-violet-300">
                  Judging
                </span>
              </div>
            </div>
            <div
              v-if="showJudgeResults && responseJudges.length"
              class="flex flex-1 flex-col gap-3 lg:max-w-xs"
            >
              <div
                v-for="judge in responseJudges"
                :key="judge.metricKey"
                class="rounded-2xl border-2 border-violet-400/30 bg-white/5 p-4 transition-all"
              >
                <p class="font-game text-xs uppercase tracking-wider text-violet-300">
                  {{ judge.metricKey }}
                </p>
                <p class="mt-2 text-sm font-medium text-violet-100">
                  Score: {{ formatJudgeScore(judge.score) }}
                </p>
                <p
                  v-if="judge.reasoning"
                  class="mt-2 text-xs leading-relaxed text-slate-400"
                >
                  <span v-html="normalizeLineBreaks(judge.reasoning)"></span>
                </p>
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
      v-if="isDebugOpen"
      class="fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl border border-violet-400/40 bg-slate-950/95 p-4 text-xs text-slate-200 shadow-2xl"
    >
      <div class="flex items-center justify-between">
        <p class="font-game text-xs uppercase tracking-wider text-violet-300">
          Debug Console
        </p>
        <button
          class="rounded-full border border-violet-400/40 px-2 py-1 text-[10px] text-violet-100 transition hover:border-violet-300 hover:text-violet-50"
          @click="isDebugOpen = false"
        >
          Close
        </button>
      </div>
      <div class="mt-3 space-y-3">
        <div>
          <p class="text-[10px] uppercase tracking-wider text-violet-200/80">
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
                <span class="uppercase tracking-wider text-violet-200/80">
                  {{ entry.level }}
                </span>
              </p>
              <p class="text-slate-200">{{ entry.message }}</p>
            </div>
          </div>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-wider text-violet-200/80">
            AI backend logs
          </p>
          <div
            class="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2"
          >
            <p v-if="!backendLogs.length" class="text-[10px] text-slate-400">
              No backend logs yet.
            </p>
            <div
              v-for="(entry, index) in backendLogs"
              :key="`backend-${index}`"
              class="space-y-1 text-[10px]"
            >
              <p class="text-slate-500">
                {{ entry.ts }}
                <span class="uppercase tracking-wider text-violet-200/80">
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { trackEvent } from '~/utils/analytics'
import { useCart } from '~/composables/useCart'

const normalizeLineBreaks = (text: string | undefined | null) =>
  text?.replace(/\\n/g, '\n').replace(/\n/g, '<br>') ?? ''

const game = {
  name: 'AI-t Mile',
  pack: 'Party Game Collection',
  tagline: 'Think you can out-rap an AI? Drop your bars and find out.',
  players: '3-8 players',
  badges: ['Hip-hop', 'Rap', 'AI'],
  platforms: ['Steam', 'Switch', 'PS5', 'Xbox'],
  image: '/images/blastbeat-battle.png',
  highlights: [
    'Face off against an AI MC that drops opening bars on every topic.',
    'Write your best response bars and let the judge crown a winner.',
    'Fast rounds keep the cypher moving and the crowd hyped.'
  ],
  storeLinks: [
    { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
    { label: 'Buy on PlayStation', url: 'https://store.playstation.com/' },
    { label: 'Buy on Xbox', url: 'https://www.xbox.com/' }
  ]
} as const

const config = useRuntimeConfig()
const { $launchDarkly, $debugLogs } = useNuxtApp()
const { addItem, openDrawer } = useCart()

const aiBackendBase = computed(() =>
  String(config.public.aiBackendUrl ?? 'http://localhost:8000').replace(/\/$/, '')
)

const topic = ref('')
const aiBars = ref('')
const response = ref('')
const result = ref<RoundResult | null>(null)
const isBusy = ref(false)
const errorMessage = ref('')
const isDebugOpen = ref(false)
const showJudgeResults = ref(false)
const promptFallbackUsed = ref(false)
const judgeFallbackUsed = ref(false)

type DebugLogEntry = {
  ts: string
  level: string
  message: string
}

type JudgeDisplay = {
  metricKey: string
  score: number
  reasoning: string
}

type RoundResult = {
  score: number
  winner?: string
  verdict: string
  comment?: string
  meta?: {
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  }
}

const roundJudges = ref<JudgeDisplay[]>([])
const responseJudges = ref<JudgeDisplay[]>([])
const backendLogs = ref<DebugLogEntry[]>([])

const clientLogs = computed<DebugLogEntry[]>(
  () => ($debugLogs?.logs?.value as DebugLogEntry[]) ?? []
)

const hasAnyJudgeResults = computed(
  () => roundJudges.value.length > 0 || responseJudges.value.length > 0
)

const winnerHeadline = computed(() => {
  const winner = result.value?.winner?.toLowerCase()
  if (winner === 'human') return 'You win this round!'
  if (winner === 'ai') return 'The AI takes it.'
  if (winner === 'tie') return 'Too close to call.'
  return ''
})

let backendLogTimer: ReturnType<typeof setInterval> | null = null

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

const postAiConfig = <T,>(body: Record<string, unknown>) =>
  $fetch<T>(`${aiBackendBase.value}/api/ai-config`, {
    method: 'POST',
    body
  })

const fetchBackendLogs = async () => {
  try {
    const payload = await $fetch<{ logs?: DebugLogEntry[] }>(
      `${aiBackendBase.value}/api/debug-logs`
    )
    backendLogs.value = payload.logs ?? []
  } catch {
    // Ignore debug polling errors.
  }
}

watch(isDebugOpen, (isOpen) => {
  if (isOpen) {
    void fetchBackendLogs()
    if (!backendLogTimer) {
      backendLogTimer = setInterval(fetchBackendLogs, 3000)
    }
  } else if (backendLogTimer) {
    clearInterval(backendLogTimer)
    backendLogTimer = null
  }
})

const handleDebugHotkey = (event: KeyboardEvent) => {
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
  trackEvent('pdp_view', { product_id: 'a-it-mile' })
  window.addEventListener('keydown', handleDebugHotkey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleDebugHotkey)
  if (backendLogTimer) {
    clearInterval(backendLogTimer)
    backendLogTimer = null
  }
})

const handleAddToCart = () => {
  addItem({ id: 'a-it-mile', name: game.name })
  openDrawer()
  trackEvent('add_to_cart', { product_id: 'a-it-mile', purchase_type: 'direct' })
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

const collectJudges = (source: unknown): JudgeDisplay[] => {
  if (!source || typeof source !== 'object') return []
  if (Array.isArray(source)) {
    return source.map(normalizeJudgeDisplay).filter((j): j is JudgeDisplay => j !== null)
  }
  const single = normalizeJudgeDisplay(source)
  return single ? [single] : []
}

const normalizeRoundResult = (value: unknown): RoundResult | null => {
  if (!value || typeof value !== 'object') return null
  const payload = value as {
    score?: unknown
    winner?: unknown
    verdict?: unknown
    comment?: unknown
    meta?: unknown
  }
  if (typeof payload.score !== 'number' || typeof payload.verdict !== 'string') {
    return null
  }
  const meta = payload.meta as { usage?: unknown } | undefined
  return {
    score: Math.round(payload.score),
    winner: typeof payload.winner === 'string' ? payload.winner : undefined,
    verdict: payload.verdict,
    comment: typeof payload.comment === 'string' ? payload.comment : undefined,
    meta:
      meta && typeof meta === 'object' && meta.usage && typeof meta.usage === 'object'
        ? { usage: meta.usage as RoundResult['meta'] extends { usage?: infer U } ? U : never }
        : undefined
  }
}

const formatUsage = (usage: {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}) => {
  const parts: string[] = []
  if (typeof usage.inputTokens === 'number') parts.push(`in ${usage.inputTokens}`)
  if (typeof usage.outputTokens === 'number') parts.push(`out ${usage.outputTokens}`)
  if (typeof usage.totalTokens === 'number') parts.push(`total ${usage.totalTokens}`)
  return parts.join(' · ')
}

const formatJudgeScore = (score: number) => {
  if (Number.isNaN(score)) return 'n/a'
  return `${Math.round(score * 100)}%`
}

const scoreColorClass = (score: number) => {
  if (score >= 80) return 'text-emerald-200'
  if (score >= 50) return 'text-amber-200'
  return 'text-amber-100'
}

const startRound = async () => {
  errorMessage.value = ''
  result.value = null
  response.value = ''
  topic.value = ''
  aiBars.value = ''
  roundJudges.value = []
  responseJudges.value = []
  promptFallbackUsed.value = false
  judgeFallbackUsed.value = false
  isBusy.value = true
  try {
    const output = await postAiConfig<{
      topic?: string
      bars?: string
      judge?: unknown
      fallback?: { prompt?: boolean }
    }>({
      type: 'ait-prompt',
      context: buildContextPayload()
    })
    if (typeof output.topic === 'string') topic.value = output.topic
    if (typeof output.bars === 'string') aiBars.value = output.bars
    roundJudges.value = collectJudges(output.judge)
    promptFallbackUsed.value = Boolean(output.fallback?.prompt)
    if (!topic.value || !aiBars.value) {
      errorMessage.value = 'Could not load a round. Try again.'
    }
  } catch {
    errorMessage.value = 'AI backend unavailable. Start the FastAPI server and try again.'
  } finally {
    isBusy.value = false
  }
}

const submitResponse = async () => {
  if (!topic.value || !aiBars.value || !response.value.trim()) return
  errorMessage.value = ''
  judgeFallbackUsed.value = false
  responseJudges.value = []
  isBusy.value = true
  try {
    const output = await postAiConfig<{
      score?: number
      winner?: string
      verdict?: string
      comment?: string
      meta?: RoundResult['meta']
      judge?: unknown
      fallback?: { judge?: boolean }
    }>({
      type: 'ait-judge',
      input: {
        topic: topic.value,
        ai_bars: aiBars.value,
        response: response.value.trim()
      },
      context: buildContextPayload()
    })
    const normalized = normalizeRoundResult(output)
    if (!normalized) {
      errorMessage.value = 'Judge returned an unexpected response.'
      return
    }
    result.value = normalized
    responseJudges.value = collectJudges(output.judge)
    judgeFallbackUsed.value = Boolean(output.fallback?.judge)
  } catch {
    errorMessage.value = 'Judge unavailable. Check the AI backend and try again.'
  } finally {
    isBusy.value = false
  }
}
</script>
