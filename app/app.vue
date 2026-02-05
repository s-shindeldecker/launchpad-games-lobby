<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white"
  >
    <div class="flex min-h-screen">
      <AppNav />
      <div class="flex min-h-screen flex-1 flex-col">
        <main class="flex-1">
          <NuxtPage />
        </main>
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppFooter from '~/components/AppFooter.vue'
import AppNav from '~/components/AppNav.vue'
</script>
