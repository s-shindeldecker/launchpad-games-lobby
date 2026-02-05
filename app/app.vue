<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white"
  >
    <AppNav />
    <main class="min-h-[calc(100vh-160px)]">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppFooter from '~/components/AppFooter.vue'
import AppNav from '~/components/AppNav.vue'
</script>
