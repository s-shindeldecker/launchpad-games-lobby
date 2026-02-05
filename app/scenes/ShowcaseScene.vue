<template>
  <main
    class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white"
  >
    <section
      class="mx-auto flex max-w-6xl flex-col gap-10 rounded-[32px] border border-white/10 bg-white/5 px-6 py-10 shadow-2xl shadow-indigo-950/60 backdrop-blur-sm"
    >
      <header class="flex flex-col gap-4">
        <p class="text-sm uppercase tracking-[0.3em] text-fuchsia-200">
          Launchpad Games Showcase
        </p>
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 class="text-4xl font-semibold sm:text-5xl">
              Welcome to the party
            </h1>
            <p class="mt-3 max-w-xl text-base text-slate-100/90">
              Discover the packs, meet Toggle, and find your next party-night
              favorite.
            </p>
          </div>
          <div class="flex gap-3">
            <button
              class="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:bg-fuchsia-400"
            >
              View Packs
            </button>
            <button
              class="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:border-white/50"
            >
              Buy Now
            </button>
          </div>
        </div>
      </header>

      <section class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          class="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/50 p-8 shadow-2xl shadow-indigo-950/70 ring-1 ring-fuchsia-400/20"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Toggle Showcase</h2>
            <div class="flex flex-col items-end gap-2">
              <span
                class="rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs text-fuchsia-100 shadow-lg shadow-fuchsia-500/40 ring-1 ring-fuchsia-300/40 motion-safe:animate-pulse"
              >
                Featured Pack: Starbound
              </span>
              <div class="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                <span class="rounded-full border border-white/10 px-2 py-0.5">
                  Steam
                </span>
                <span class="rounded-full border border-white/10 px-2 py-0.5">
                  Console
                </span>
                <span class="rounded-full border border-white/10 px-2 py-0.5">
                  Web
                </span>
              </div>
            </div>
          </div>
          <p class="mt-2 text-sm text-slate-100/80">
            Toggle avatars drift through the scene, showcasing each pack's
            energy.
          </p>

          <div class="mt-8 flex flex-wrap gap-6">
            <ToggleShowcaseAvatar
              v-for="player in players"
              :key="player.name"
              :name="player.name"
              :status="player.status"
            />
          </div>

          <div
            class="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl"
          />
          <div
            class="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl"
          />
        </div>

        <PackLineup :players="players" />
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
const players = [
  { name: 'Avery', status: 'Featured' },
  { name: 'Miles', status: 'New' },
  { name: 'Nova', status: 'Featured' },
  { name: 'Piper', status: 'Coming Soon' }
]
</script>
