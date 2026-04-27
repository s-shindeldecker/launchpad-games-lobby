<template>
  <div>
    <div
      class="px-6 py-12 transition-opacity duration-200"
      :class="simulationRunning ? 'pointer-events-none select-none opacity-35' : ''"
    >
      <section class="mx-auto flex max-w-6xl flex-col gap-6">
      <div class="relative overflow-hidden rounded-[32px] border border-white/10">
        <img
          src="/images/Launchpad_Games_Hero.png"
          alt="Launchpad Games hero"
          class="w-full object-cover"
        />
        <div class="absolute inset-0 flex items-end">
          <div class="p-6 sm:p-8">
            <NuxtLink
              :to="cta.href"
              :class="ctaClasses"
              :style="ctaStyle"
              @click="onHomeHeroCtaClick"
            >
              {{ cta.text }}
            </NuxtLink>
          </div>
        </div>
      </div>
      </section>
    </div>

    <Teleport to="body">
      <Transition name="sim-fade">
        <div
          v-if="simulationRunning"
          class="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-live="assertive"
          aria-labelledby="home-sim-title"
        >
          <div
            class="max-w-md rounded-2xl border border-white/15 bg-slate-900/95 p-6 text-center shadow-2xl"
          >
            <p
              id="home-sim-title"
              class="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200"
            >
              Simulation running
            </p>
            <p class="mt-3 text-lg font-semibold text-white">
              Generating demo users and analytics events
            </p>
            <p class="mt-3 text-sm leading-relaxed text-slate-300">
              The app is dimmed while the loop runs. Press
              <kbd
                class="mx-1 inline-block rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-xs text-white"
              >
                ⌘ K
              </kbd>
              (Command–K) to stop.
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useCart } from '~/composables/useCart'
import { useLaunchDarkly } from '~/composables/useLaunchDarkly'
import { trackEvent } from '~/utils/analytics'

const SIM_GAMES = [
  { slug: 'talkin-ship', name: "Talkin' Ship" },
  { slug: 'tavern-games', name: 'Tavern Games' },
  { slug: 'tag-it-toggle-it', name: 'Tag it & Toggle it' },
  { slug: 'laugh-labyrinth', name: 'Laugh Labyrinth' },
  { slug: 'blastbeat-battle', name: 'Blastbeat Battle' },
  { slug: 'neon-quizline', name: 'Neon Quizline' }
] as const

/** Chance per loop iteration to run a cart add (then purchase or abandon). */
const CART_SIM_CHANCE = 0.12
/** If cart sim runs, probability of completing purchase vs abandoning. */
const CART_PURCHASE_RATE = 0.55

type CtaConfig = {
  text: string
  href: string
  size: 'sm' | 'md' | 'lg'
  color: string
}

const defaultCta: CtaConfig = {
  text: 'Explore the Games',
  href: '/games',
  size: 'md',
  color: '#d946ef'
}

const normalizeCtaConfig = (value: unknown): CtaConfig => {
  if (!value || typeof value !== 'object') return { ...defaultCta }
  const config = value as Record<string, unknown>
  const cta: CtaConfig = { ...defaultCta }
  if (typeof config.text === 'string') cta.text = config.text
  if (typeof config.href === 'string') cta.href = config.href
  if (
    typeof config.size === 'string' &&
    ['sm', 'md', 'lg'].includes(config.size)
  ) {
    cta.size = config.size as CtaConfig['size']
  }
  if (
    typeof config.color === 'string' &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(config.color)
  ) {
    cta.color = config.color
  }
  return cta
}

const { getFlagValue, isReady } = useLaunchDarkly()
const ctaConfig = ref<CtaConfig>({ ...defaultCta })

watchEffect(() => {
  if (!isReady.value) return
  const flagValue = getFlagValue('home-hero-cta', defaultCta)
  ctaConfig.value = normalizeCtaConfig(flagValue)
})

const cta = computed(() => ctaConfig.value)

const onHomeHeroCtaClick = () => {
  trackEvent('home_hero_cta_click', {
    href: cta.value.href,
    text: cta.value.text,
    size: cta.value.size,
    color: cta.value.color
  })
}

const simulationRunning = ref(false)

const { addItem, clearCart, cartItems, subtotal } = useCart()

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const orderId = () => `order-${Date.now().toString(36)}`

const maybeSimulateCartSession = async () => {
  if (Math.random() > CART_SIM_CHANCE) return
  const game = SIM_GAMES[Math.floor(Math.random() * SIM_GAMES.length)]
  clearCart()
  await nextTick()
  addItem({ id: game.slug, name: game.name })
  await nextTick()
  trackEvent('add_to_cart', {
    product_id: game.slug,
    purchase_type: 'direct',
    simulated: true
  })
  if (Math.random() < CART_PURCHASE_RATE) {
    const cartValue = Number(subtotal.value.toFixed(2))
    const itemCount = cartItems.value.reduce((t, item) => t + item.quantity, 0)
    trackEvent('checkout_start', { cart_value: cartValue, simulated: true })
    trackEvent('purchase_complete', {
      order_id: orderId(),
      cart_value: cartValue,
      purchase_type: 'direct',
      simulated: true
    })
    trackEvent('items_purchased', { simulated: true }, itemCount)
    trackEvent('purchase_value', { simulated: true }, cartValue)
  } else {
    trackEvent('cart_abandoned', {
      product_id: game.slug,
      simulated: true
    })
  }
  clearCart()
  await nextTick()
}

const runHomeSimulationLoop = async () => {
  const { $launchDarkly } = useNuxtApp()
  while (simulationRunning.value) {
    if (
      isReady.value &&
      $launchDarkly?.setContext &&
      $launchDarkly?.createUserContext
    ) {
      await $launchDarkly.setContext($launchDarkly.createUserContext(true))
      await nextTick()
      if (Math.random() < 0.5) {
        trackEvent('home_hero_cta_click', {
          href: cta.value.href,
          text: cta.value.text,
          size: cta.value.size,
          color: cta.value.color,
          simulated: true
        })
      }
      await maybeSimulateCartSession()
    }
    await sleep(60)
  }
}

const toggleHomeSimulation = () => {
  if (simulationRunning.value) {
    simulationRunning.value = false
    clearCart()
    return
  }
  simulationRunning.value = true
  void runHomeSimulationLoop()
}

const onHomeSimKeydown = (e: KeyboardEvent) => {
  if (e.metaKey && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleHomeSimulation()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onHomeSimKeydown)
})

onUnmounted(() => {
  simulationRunning.value = false
  clearCart()
  window.removeEventListener('keydown', onHomeSimKeydown)
})

const sizeClasses: Record<CtaConfig['size'], string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg'
}

const ctaStyle = computed(() => ({
  backgroundColor: cta.value.color
}))

const ctaClasses = computed(
  () =>
    [
      'inline-flex items-center justify-center rounded-full font-semibold text-white shadow-lg transition hover:brightness-110',
      sizeClasses[cta.value.size]
    ].join(' ')
)
</script>

<style scoped>
.sim-fade-enter-active,
.sim-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sim-fade-enter-from,
.sim-fade-leave-to {
  opacity: 0;
}
</style>
