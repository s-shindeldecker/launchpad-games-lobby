<template>
  <div class="px-6 pb-16 pt-10">
    <section class="mx-auto flex max-w-6xl flex-col gap-10">
      <header class="flex flex-col gap-6">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-fuchsia-200">
              Launchpad Games
            </p>
            <h1 class="mt-3 text-4xl font-semibold sm:text-5xl">
              {{ plpTitle }}
            </h1>
            <p class="mt-3 max-w-2xl text-base text-slate-200/90">
              {{ plpSubtitle }}
            </p>
          </div>
          <div
            class="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-4 text-sm text-slate-200"
          >
            <p class="text-xs uppercase tracking-[0.3em] text-slate-400">
              Featured Party Game
            </p>
            <p class="mt-2 text-lg font-semibold text-white">
              Talkin' Ship
            </p>
            <p class="mt-1 text-xs text-slate-400">Party Game Highlight</p>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-xs text-slate-300"
        >
          <span class="text-slate-400">Sort by</span>
          <button class="rounded-full border border-white/10 px-3 py-1">
            Release Date
          </button>
          <span class="text-slate-500">|</span>
          <span class="text-slate-400">Party Games</span>
          <button class="rounded-full border border-white/10 px-3 py-1">
            Any
          </button>
          <span class="text-slate-500">|</span>
          <span class="text-slate-400">Players</span>
          <button class="rounded-full border border-white/10 px-3 py-1">
            Any
          </button>
        </div>
      </header>

      <section
        :class="[
          'grid gap-6 md:grid-cols-2',
          plpGridClassMap[plpColumns] ?? 'xl:grid-cols-3'
        ]"
      >
        <GameCard
          v-for="game in games"
          :key="game.slug"
          :game="{
            ...game,
            imageSize: plpLargeImages.value ? 'large' : 'default',
            chipSize: plpColumns >= 5 ? 'compact' : 'default'
          }"
        />
      </section>

      <div
        class="rounded-2xl border border-dashed border-fuchsia-400/50 bg-slate-950/60 px-4 py-3 text-xs text-fuchsia-200"
      >
        <p class="text-[11px] uppercase tracking-[0.3em] text-fuchsia-300">
          Simulation (dev only)
        </p>
        <p class="mt-2 text-slate-300">
          Trigger simulated PLP sessions with demo events.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            class="rounded-full border border-fuchsia-400/40 px-3 py-1 text-xs text-fuchsia-100 transition hover:bg-fuchsia-500/20"
            @click="runSimulationBatch(10)"
          >
            Run 10
          </button>
          <button
            class="rounded-full border border-fuchsia-400/40 px-3 py-1 text-xs text-fuchsia-100 transition hover:bg-fuchsia-500/20"
            @click="runSimulationBatch(100)"
          >
            Run 100
          </button>
          <button
            class="rounded-full border border-fuchsia-400/40 px-3 py-1 text-xs text-fuchsia-100 transition hover:bg-fuchsia-500/20"
            @click="runSimulationBatch(500)"
          >
            Run 500
          </button>
        </div>
        <div class="mt-4">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Progress</span>
            <span>{{ simulationCompleted }} / {{ simulationTotal }}</span>
          </div>
          <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              class="h-full rounded-full bg-fuchsia-500 transition-[width] duration-300"
              :style="{ width: `${simulationProgress}%` }"
            ></div>
          </div>
          <p class="mt-2 text-[11px] text-slate-500">
            {{ simulationStatus }}
          </p>
          <p class="mt-2 text-[11px] text-slate-500">
            Active user: {{ simulationUserLabel }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import GameCard from '~/components/GameCard.vue'
import { useLaunchDarkly } from '~/composables/useLaunchDarkly'
import { trackEvent } from '~/utils/analytics'
import { simulateUserSession } from '~/utils/simulateUserSession'

const { getFlagValue, isReady } = useLaunchDarkly()
const plpTitle = ref('Party Games Catalog')
const plpSubtitle = ref(
  'Browse the individual party games available in the Launchpad lineup.'
)
const plpLargeImages = ref(false)
const plpColumns = ref(3)
const plpVariant = computed(() => (plpLargeImages.value ? 'large' : 'control'))
const { $launchDarkly } = useNuxtApp()
const simulationUserLabel = computed(() => {
  const context = $launchDarkly?.context?.value
  if (!context) return 'User context unavailable'
  const anonLabel = context.anonymous ? 'anonymous' : 'identified'
  return `${context.key} (${anonLabel})`
})
const simulationTotal = ref(0)
const simulationCompleted = ref(0)
const simulationInFlight = ref(0)
const simulationStatus = computed(() => {
  if (!simulationTotal.value) return 'Idle'
  if (simulationCompleted.value >= simulationTotal.value) return 'Complete'
  return `Running (${simulationInFlight.value} active)`
})
const simulationProgress = computed(() => {
  if (!simulationTotal.value) return 0
  return Math.min(
    100,
    Math.round((simulationCompleted.value / simulationTotal.value) * 100)
  )
})
const recordPlpFlagEvaluations = () => {
  // Ensure per-user exposure by evaluating PLP flags after identify.
  getFlagValue('plp-large-images', plpLargeImages.value)
  getFlagValue('plp-number-of-columns', plpColumns.value)
  getFlagValue('plp-title', plpTitle.value)
  getFlagValue('plp-subtitle', plpSubtitle.value)
}
const plpGridClassMap: Record<number, string> = {
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5'
}

const clampColumns = (value: number) => Math.min(5, Math.max(2, value))

onMounted(() => {
  // Exposure denominator for PLP experiments.
  trackEvent('plp_view', { page: 'games' })
})

watchEffect(() => {
  if (!isReady.value) return
  plpTitle.value = getFlagValue('plp-title', plpTitle.value)
  plpSubtitle.value = getFlagValue('plp-subtitle', plpSubtitle.value)
  plpLargeImages.value = getFlagValue('plp-large-images', false)
  const columns = clampColumns(
    getFlagValue('plp-number-of-columns', plpColumns.value)
  )
  plpColumns.value = columns
})

const runSimulationBatch = (count: number) => {
  if (count <= 0) return
  simulationTotal.value += count
  console.info('[SIMULATION] Starting batch', {
    count,
    variant: plpVariant.value
  })
  for (let i = 0; i < count; i += 1) {
    const stagger = Math.floor(Math.random() * 200)
    setTimeout(() => {
      simulationInFlight.value += 1
      simulateUserSession({
        variant: plpVariant.value,
        games,
        trackEvent,
        identifyUser: async () => {
          if (!$launchDarkly?.setContext || !$launchDarkly?.createUserContext) {
            return
          }
          await $launchDarkly.setContext($launchDarkly.createUserContext(true))
          recordPlpFlagEvaluations()
        }
      })
        .catch(() => {
          // Simulation errors shouldn't impact UI; mark as completed.
        })
        .finally(() => {
          simulationInFlight.value = Math.max(0, simulationInFlight.value - 1)
          simulationCompleted.value += 1
        })
    }, i * 40 + stagger)
  }
}

const games = [
  {
    slug: 'talkin-ship',
    name: "Talkin' Ship",
    tagline:
      'Race to drop the cleverest ship-related pun for every wild situation.',
    pack: 'Party Game Collection',
    players: '3-8 players',
    badges: ['Wordplay', 'Fast', 'Witty'],
    platforms: ['Steam', 'Switch', 'PS5', 'Xbox'],
    detailed: true,
    image: '/images/talkin-ship.png'
  },
  {
    slug: 'tavern-games',
    name: 'Tavern Games',
    tagline:
      'Can you beat the fantastical creatures at this tavern in games from their own magical world?',
    pack: 'Party Game Collection',
    players: '2-8 players',
    badges: ['Fantasy', 'Challenge', 'Party'],
    platforms: ['Steam', 'Switch', 'Web'],
    detailed: true,
    image: '/images/tavern-games.png'
  },
  {
    slug: 'tag-it-toggle-it',
    name: "Tag it & Toggle it",
    tagline:
      'Make two versions of your graffiti art and toggle them into wild phrases.',
    pack: 'Party Game Collection',
    players: '3-8 players',
    badges: ['Creative', 'Mashup', 'Party'],
    platforms: ['Steam', 'Switch', 'Web'],
    detailed: true,
    image: '/images/tag-it-toggle-it.png'
  },
  {
    slug: 'laugh-labyrinth',
    name: 'Laugh Labyrinth',
    tagline: 'Co-op puzzle rooms for the most chaotic of friends.',
    pack: 'Party Game Collection',
    players: '1-6 players',
    badges: ['Co-op', 'Puzzle', 'Timers'],
    platforms: ['Steam', 'Switch', 'Web'],
    detailed: true,
    image: '/images/laugh-labyrinth.png',
    imageFocus: 'bottom'
  },
  {
    slug: 'blastbeat-battle',
    name: 'Blastbeat Battle',
    tagline: 'Rhythm duels and crowd-surfing mini-games.',
    pack: 'Party Game Collection',
    players: '2-10 players',
    badges: ['Rhythm', 'Party', 'Fast'],
    platforms: ['Steam', 'PS5', 'Xbox'],
    detailed: true,
    image: '/images/blastbeat-battle.png',
    imageFocus: 'center'
  },
  {
    slug: 'neon-quizline',
    name: 'Neon Quizline',
    tagline: 'Retro game-show trivia with laser-bright stakes.',
    pack: 'Party Game Collection',
    players: '2-8 players',
    badges: ['Trivia', 'Audience', 'Retro'],
    platforms: ['Steam', 'Switch'],
    detailed: false,
    image: '/images/neon-quizline.png',
    imageFocus: 'center'
  },
  {
    slug: 'spacetop-scribbles',
    name: 'Spacetop Scribbles',
    tagline: 'Draw the impossible, watch the chaos unfold.',
    pack: 'Party Game Collection',
    players: '3-8 players',
    badges: ['Drawing', 'Comedy', 'Creative'],
    platforms: ['Steam', 'Web'],
    detailed: false,
    image: '/images/spacetop-scribbles.png'
  },
  {
    slug: 'mystic-mashup',
    name: 'Mystic Mashup',
    tagline: 'Match wild prompts before the timer snaps.',
    pack: 'Party Game Collection',
    players: '2-8 players',
    badges: ['Wordplay', 'Fast', 'Wildcard'],
    platforms: ['Steam', 'Switch', 'PS5'],
    detailed: false,
    image: '/images/mystic-mashup.png'
  }
]
</script>
