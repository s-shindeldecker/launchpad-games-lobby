<template>
  <div class="flex flex-col items-center gap-2">
    <div
      class="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-md shadow-indigo-950/40"
    >
      <span class="text-lg font-semibold">{{ initials }}</span>
      <span
        class="absolute -bottom-1 right-2 h-3 w-3 rounded-full bg-fuchsia-400 shadow shadow-fuchsia-400/50"
      />
    </div>
    <div class="text-center text-xs">
      <p class="font-semibold">{{ name }}</p>
      <p class="text-[11px] text-slate-300">{{ status }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  status: string
}>()

const initials = computed(() =>
  props.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
)
</script>
