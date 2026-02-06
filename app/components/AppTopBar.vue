<template>
  <div
    class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 px-6 py-3 text-xs text-slate-300 backdrop-blur"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span class="uppercase tracking-[0.3em] text-fuchsia-300">Demo User</span>
        <span>{{ userLabel }}</span>
        <span class="text-slate-500">·</span>
        <span>State: {{ userState }}</span>
        <span class="text-slate-500">·</span>
        <span>Platforms: {{ userPlatforms }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="relative inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:text-white"
          @click="openDrawer"
        >
          <span class="sr-only">Open cart</span>
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L23 6H6"></path>
          </svg>
          <span>Cart</span>
          <span
            class="ml-1 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] text-white"
          >
            {{ totalItems }}
          </span>
        </button>
        <button
          class="rounded-full border border-fuchsia-400/40 px-3 py-1 text-xs text-fuchsia-100 transition hover:bg-fuchsia-500/20"
          @click="rotateUser"
        >
          New Demo User
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCart } from '~/composables/useCart'

const { $launchDarkly } = useNuxtApp()
const { openDrawer, totalItems, clearCart } = useCart()

const userLabel = computed(() => {
  const context = $launchDarkly?.context?.value
  if (!context) return 'User context unavailable'
  const anonLabel = context.anonymous ? 'anonymous' : 'identified'
  return `${context.key} (${anonLabel})`
})

const userState = computed(() => {
  const context = $launchDarkly?.context?.value
  return context?.state ?? 'n/a'
})

const userPlatforms = computed(() => {
  const context = $launchDarkly?.context?.value
  if (!context?.owned_platforms) return 'n/a'
  if (Array.isArray(context.owned_platforms)) {
    return context.owned_platforms.join(', ')
  }
  return String(context.owned_platforms)
})

const rotateUser = async () => {
  if (!$launchDarkly?.setContext || !$launchDarkly?.createUserContext) return
  clearCart()
  await $launchDarkly.setContext($launchDarkly.createUserContext(true))
}
</script>
