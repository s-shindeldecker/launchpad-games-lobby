<template>
  <div class="px-6 pb-16 pt-10">
    <section class="mx-auto flex max-w-6xl flex-col gap-10">
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

        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold text-white">What to Expect</h2>
            <ul class="mt-4 space-y-3 text-sm text-slate-200/90">
              <li v-for="item in game.highlights" :key="item">• {{ item }}</li>
            </ul>
          </div>
          <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold text-white">Buy the Pack</h2>
            <p class="mt-2 text-sm text-slate-300">
              Available now from your favorite store.
            </p>
            <div class="mt-4 flex flex-col gap-3">
              <a
                v-for="link in game.storeLinks"
                :key="link.label"
                :href="link.url"
                target="_blank"
                rel="noreferrer"
                class="rounded-full bg-fuchsia-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-fuchsia-400"
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const detailedGames = {
  'starbound-odyssey': {
    name: 'Starbound Odyssey',
    pack: 'Party Pack 10',
    tagline: 'Zero-gravity trivia with cosmic consequences.',
    players: '2-8 players',
    badges: ['Trivia', 'Teamplay', 'Buzzer'],
    platforms: ['Steam', 'Switch', 'PS5', 'Xbox'],
    highlights: [
      'Answer mind-bending questions while navigating a drifting space station.',
      'Team boosts and sabotage rounds keep everyone yelling.',
      'Spectator mode lets the crowd trigger gravity glitches.'
    ],
    storeLinks: [
      { label: 'Buy on Steam', url: 'https://store.steampowered.com/' },
      { label: 'Buy on PlayStation', url: 'https://store.playstation.com/' },
      { label: 'Buy on Xbox', url: 'https://www.xbox.com/' }
    ]
  },
  'laugh-labyrinth': {
    name: 'Laugh Labyrinth',
    pack: 'Party Pack 10',
    tagline: 'Co-op puzzle rooms for the most chaotic of friends.',
    players: '1-6 players',
    badges: ['Co-op', 'Puzzle', 'Timers'],
    platforms: ['Steam', 'Switch', 'Web'],
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
  'blastbeat-battle': {
    name: 'Blastbeat Battle',
    pack: 'Party Pack 10',
    tagline: 'Rhythm duels and crowd-surfing mini-games.',
    players: '2-10 players',
    badges: ['Rhythm', 'Party', 'Fast'],
    platforms: ['Steam', 'PS5', 'Xbox'],
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
      pack: 'Upcoming Pack',
      tagline: 'Details are still in orbit. Check back soon for the full reveal.',
      players: 'TBD',
      badges: ['TBD'],
      platforms: ['TBD'],
      highlights: [
        'This game is still incubating inside the Launchpad labs.',
        'More details will appear as soon as the pack is announced.'
      ],
      storeLinks: [{ label: 'View all games', url: '/games' }]
    }
)
</script>
