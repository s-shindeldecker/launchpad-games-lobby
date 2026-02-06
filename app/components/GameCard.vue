<template>
  <article
    class="group flex h-full flex-col rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/60 transition hover:border-fuchsia-400/50 hover:bg-slate-900/80"
  >
    <div class="relative mb-4 overflow-hidden rounded-2xl border border-white/10">
      <img
        v-if="game.image"
        :src="game.image"
        :alt="game.name"
        :class="[
          imageSize === 'large' ? 'h-56' : 'h-48',
          'w-full object-cover',
          game.imageFocus === 'bottom'
            ? 'object-bottom'
            : game.imageFocus === 'center'
              ? 'object-center'
              : 'object-top'
        ]"
      />
      <div
        v-else
        class="flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-xs text-slate-400"
      >
        Artwork coming soon
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-slate-300">
      <span class="rounded-full bg-white/10 px-2 py-1">{{ game.pack }}</span>
      <span v-if="game.detailed" class="text-fuchsia-200">Featured</span>
      <span v-else class="text-slate-500">Coming Soon</span>
    </div>

    <div class="mt-4">
      <h3 class="text-lg font-semibold text-white">{{ game.name }}</h3>
      <p class="mt-2 text-sm text-slate-200/90">{{ game.tagline }}</p>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-[11px] text-white/70">
      <span
        v-for="badge in game.badges"
        :key="badge"
        :class="[
          'rounded-full border border-white/10',
          chipSize === 'compact' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1'
        ]"
      >
        {{ badge }}
      </span>
    </div>

    <div class="mt-6 flex items-center justify-between text-xs text-slate-300">
      <span>{{ game.players }}</span>
      <span>{{ game.platforms.join(' · ') }}</span>
    </div>

    <div class="mt-6">
      <NuxtLink
        v-if="game.detailed"
        :to="`/games/${game.slug}`"
        @click="handleProductEngaged"
        class="inline-flex w-full items-center justify-center rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
      >
        View Details
      </NuxtLink>
      <button
        v-else
        disabled
        class="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-slate-500"
      >
        Details Soon
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { trackEvent } from '~/utils/analytics'

const props = defineProps<{
  game: {
    slug: string
    name: string
    tagline: string
    pack: string
    players: string
    badges: string[]
    platforms: string[]
    detailed: boolean
    image?: string
    imageFocus?: 'top' | 'bottom' | 'center'
    imageSize?: 'default' | 'large'
    chipSize?: 'default' | 'compact'
  }
}>()

const imageSize = computed(() => props.game.imageSize ?? 'default')
const chipSize = computed(() => props.game.chipSize ?? 'default')

const handleProductEngaged = () => {
  // Primary metric: capture intentional engagement from the PLP.
  trackEvent('product_engaged', { product_id: props.game.slug })
}
</script>
