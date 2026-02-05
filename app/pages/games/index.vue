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
              Party Pack Games
            </h1>
            <p class="mt-3 max-w-2xl text-base text-slate-200/90">
              Explore the lineup of Launchpad party games. Pick a pack, gather
              your crew, and start the chaos across Steam, console, and web.
            </p>
          </div>
          <div
            class="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-4 text-sm text-slate-200"
          >
            <p class="text-xs uppercase tracking-[0.3em] text-slate-400">
              Featured Pack
            </p>
            <p class="mt-2 text-lg font-semibold text-white">
              Starbound Odyssey
            </p>
            <p class="mt-1 text-xs text-slate-400">Party Pack 10</p>
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
          <span class="text-slate-400">Pack</span>
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

      <section class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <GameCard v-for="game in games" :key="game.slug" :game="game" />
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import GameCard from '~/components/GameCard.vue'

const games = [
  {
    slug: 'starbound-odyssey',
    name: 'Starbound Odyssey',
    tagline: 'Zero-gravity trivia with cosmic consequences.',
    pack: 'Party Pack 10',
    players: '2-8 players',
    badges: ['Trivia', 'Teamplay', 'Buzzer'],
    platforms: ['Steam', 'Switch', 'PS5', 'Xbox'],
    detailed: true
  },
  {
    slug: 'laugh-labyrinth',
    name: 'Laugh Labyrinth',
    tagline: 'Co-op puzzle rooms for the most chaotic of friends.',
    pack: 'Party Pack 10',
    players: '1-6 players',
    badges: ['Co-op', 'Puzzle', 'Timers'],
    platforms: ['Steam', 'Switch', 'Web'],
    detailed: true
  },
  {
    slug: 'blastbeat-battle',
    name: 'Blastbeat Battle',
    tagline: 'Rhythm duels and crowd-surfing mini-games.',
    pack: 'Party Pack 10',
    players: '2-10 players',
    badges: ['Rhythm', 'Party', 'Fast'],
    platforms: ['Steam', 'PS5', 'Xbox'],
    detailed: true
  },
  {
    slug: 'neon-quizline',
    name: 'Neon Quizline',
    tagline: 'Retro game-show trivia with laser-bright stakes.',
    pack: 'Party Pack 9',
    players: '2-8 players',
    badges: ['Trivia', 'Audience', 'Retro'],
    platforms: ['Steam', 'Switch'],
    detailed: false
  },
  {
    slug: 'spacetop-scribbles',
    name: 'Spacetop Scribbles',
    tagline: 'Draw the impossible, watch the chaos unfold.',
    pack: 'Party Pack 9',
    players: '3-8 players',
    badges: ['Drawing', 'Comedy', 'Creative'],
    platforms: ['Steam', 'Web'],
    detailed: false
  },
  {
    slug: 'mystic-mashup',
    name: 'Mystic Mashup',
    tagline: 'Match wild prompts before the timer snaps.',
    pack: 'Party Pack 8',
    players: '2-8 players',
    badges: ['Wordplay', 'Fast', 'Wildcard'],
    platforms: ['Steam', 'Switch', 'PS5'],
    detailed: false
  }
]
</script>
