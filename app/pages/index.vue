<template>
  <div class="px-6 py-16">
    <section class="mx-auto flex max-w-6xl flex-col gap-6 text-center">
      <p class="text-xs uppercase tracking-[0.4em] text-fuchsia-200">
        Launchpad Games
      </p>
      <h1 class="text-4xl font-semibold sm:text-5xl">
        Discover the Party Pack lineup
      </h1>
      <p class="mx-auto max-w-2xl text-base text-slate-200/90">
        Jump into the full games list and explore what is available across
        Steam, console, and web.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink
          to="/games"
          class="rounded-full bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
        >
          Browse Games
        </NuxtLink>
        <NuxtLink
          to="/games/starbound-odyssey"
          class="rounded-full border border-white/20 px-6 py-3 text-sm text-white/90"
        >
          Featured Pack
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
