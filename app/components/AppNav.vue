<template>
  <aside class="h-full w-64 border-r border-white/10 bg-slate-950/90">
    <div class="flex h-full flex-col gap-10 px-6 py-6">
      <NuxtLink to="/" class="flex flex-col items-center gap-4 text-center">
        <div class="flex h-28 w-28 items-center justify-center">
          <img
            src="/images/launchpad-logo.png"
            alt="Launchpad Games logo"
            class="h-full w-full object-contain"
          />
        </div>
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-fuchsia-200">
            Launchpad Games
          </p>
          <p class="text-xs text-slate-300">Party Pack Showcase</p>
        </div>
      </NuxtLink>

      <nav class="flex flex-col gap-3 text-sm text-slate-200">
        <NuxtLink to="/" class="text-white">Home</NuxtLink>
        <NuxtLink to="/games" class="text-slate-300 hover:text-white">
          Games
        </NuxtLink>
        <a class="text-slate-300 hover:text-white" href="#">Packs</a>
        <a class="text-slate-300 hover:text-white" href="#">How to Play</a>
        <a class="text-slate-300 hover:text-white" href="#">Shop</a>
      </nav>
    </div>
  </aside>
</template>
