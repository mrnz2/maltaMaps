// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-04',
  devtools: { enabled: true },

  /** Wyłączone — na dev bez pełnego buildu powoduje błąd Vite: #app-manifest */
  experimental: {
    appManifest: false,
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],

  css: ['~/assets/css/main.css', 'mapbox-gl/dist/mapbox-gl.css'],

  runtimeConfig: {
    public: {
      /** Mapbox GL access token — set MAPBOX_ACCESS_TOKEN in .env */
      mapboxAccessToken:
        process.env.NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        || process.env.MAPBOX_ACCESS_TOKEN
        || '',
    },
    /** Supabase project URL — set SUPABASE_URL in .env (also used by @nuxtjs/supabase) */
    supabaseUrl: process.env.SUPABASE_URL || '',
    /** Supabase anon/service key — set SUPABASE_KEY in .env */
    supabaseKey: process.env.SUPABASE_KEY || '',
  },

  supabase: {
    redirect: false,
  },

  app: {
    head: {
      title: 'Malta Maps — Atrakcje i kupony',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap',
        },
      ],
      meta: [
        { name: 'description', content: 'Interaktywna mapa Malty z atrakcjami i kodami promocyjnymi' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['mapbox-gl'],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
