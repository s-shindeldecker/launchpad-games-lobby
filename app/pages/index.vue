<template>
  <div class="px-6 py-12">
    <section class="mx-auto flex max-w-6xl flex-col gap-6">
      <div class="relative overflow-hidden rounded-[32px] border border-white/10">
        <img
          src="/images/Launchpad_Games_Hero.png"
          alt="Launchpad Games hero"
          class="w-full object-cover"
        />
        <div class="absolute inset-0 flex items-end">
          <div class="p-6 sm:p-8">
            <NuxtLink :to="cta.href" :class="ctaClasses" :style="ctaStyle">
              {{ cta.text }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useLaunchDarkly } from '~/composables/useLaunchDarkly'

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
