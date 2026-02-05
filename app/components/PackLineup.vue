<template>
  <aside
    class="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-lg shadow-indigo-950/40 opacity-90 saturate-100"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-slate-100">Pack Lineup</h2>
      <span class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
        {{ players.length }} highlights
      </span>
    </div>

    <ul class="flex flex-col gap-3">
      <li
        v-for="player in players"
        :key="player.name"
        class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <div>
          <p class="text-sm font-semibold">{{ player.name }}</p>
          <p class="text-xs text-slate-200/80">Featured Toggle</p>
        </div>
        <span class="text-xs text-fuchsia-100/90">{{ player.status }}</span>
      </li>
    </ul>

    <div
      class="mt-auto rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3"
    >
      <p class="text-xs uppercase tracking-[0.3em] text-slate-300">
        Coming Soon
      </p>
      <p class="mt-2 text-sm text-slate-100/90">
        New packs drop throughout the year.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  players: Array<{
    name: string
    status: string
  }>
}>()
</script>
