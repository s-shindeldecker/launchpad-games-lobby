// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    public: {
      ldClientId: process.env.NUXT_PUBLIC_LD_CLIENT_ID,
      amplitudeApiKey: process.env.NUXT_PUBLIC_AMPLITUDE_API_KEY
    }
  },
  app: {
    head: {
      title: 'Launchpad Games Lobby',
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Fredoka+One&display=swap'
        }
      ],
      meta: [
        {
          name: 'description',
          content:
            'A playful, animated party-game lobby experience from Launchpad Games.'
        }
      ]
    }
  }
})
