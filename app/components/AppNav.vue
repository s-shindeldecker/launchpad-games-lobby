<template>
  <header class="border-b border-white/10 bg-slate-950/80 backdrop-blur">
    <div
      class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
    >
      <NuxtLink to="/games" class="flex items-center gap-3">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/20 text-lg font-semibold text-fuchsia-200"
        >
          LG
        </span>
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-fuchsia-200">
            Launchpad Games
          </p>
          <p class="text-xs text-slate-300">Party Pack Showcase</p>
        </div>
      </NuxtLink>

      <nav class="hidden items-center gap-6 text-sm text-slate-200 md:flex">
        <NuxtLink to="/games" class="text-white">Games</NuxtLink>
        <a class="text-slate-300 hover:text-white" href="#">Packs</a>
        <a class="text-slate-300 hover:text-white" href="#">How to Play</a>
        <a class="text-slate-300 hover:text-white" href="#">Shop</a>
      </nav>
    </div>
  </header>
</template>
