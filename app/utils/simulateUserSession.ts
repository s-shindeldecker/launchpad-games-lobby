type SimulationVariant = 'control' | 'large'

type SimulationGame = {
  slug: string
}

type SimulationInput = {
  variant: SimulationVariant
  games: SimulationGame[]
  trackEvent: (eventName: string, payload?: Record<string, unknown>) => void
  identifyUser?: () => Promise<void> | void
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

const pickEngagementRate = (variant: SimulationVariant) => {
  if (variant === 'large') {
    return randomBetween(0.12, 0.18)
  }
  return randomBetween(0.08, 0.12)
}

export const simulateUserSession = async ({
  variant,
  games,
  trackEvent,
  identifyUser
}: SimulationInput) => {
  if (!import.meta.dev) return
  if (!games.length) {
    console.info('[SIMULATION] No games provided for simulation.')
    return
  }

  if (identifyUser) {
    await identifyUser()
  }

  const engagementRate = pickEngagementRate(variant)
  console.info('[SIMULATION] Starting simulated user session', {
    variant,
    engagementRate: Number(engagementRate.toFixed(3))
  })

  // Exposure denominator: PLP view.
  trackEvent('plp_view', { page: 'games', simulated: true })
  await sleep(randomBetween(300, 1200))

  if (Math.random() > engagementRate) {
    console.info('[SIMULATION] User did not engage with a product.')
    return
  }

  const game = games[Math.floor(Math.random() * games.length)]
  trackEvent('product_engaged', { product_id: game.slug, simulated: true })
  await sleep(randomBetween(100, 400))
  trackEvent('pdp_view', { product_id: game.slug, simulated: true })

  console.info('[SIMULATION] Completed simulated user session', {
    product_id: game.slug
  })
}
