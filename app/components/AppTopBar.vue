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
      <button
        class="rounded-full border border-fuchsia-400/40 px-3 py-1 text-xs text-fuchsia-100 transition hover:bg-fuchsia-500/20"
        @click="rotateUser"
      >
        New Demo User
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { $launchDarkly } = useNuxtApp()

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
  await $launchDarkly.setContext($launchDarkly.createUserContext(true))
}
</script>
