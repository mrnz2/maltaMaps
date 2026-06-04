<script setup lang="ts">
import { Loader2, LogIn, LogOut, Mail, User } from 'lucide-vue-next'

const user = useSupabaseUser()
const client = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const isHydrated = ref(false)

onMounted(() => {
  isHydrated.value = true
})

const isLoggedIn = computed(() => isHydrated.value && !!user.value)

async function sendMagicLink() {
  const trimmed = email.value.trim()
  if (!trimmed) {
    feedback.value = { type: 'error', text: 'Podaj adres e-mail.' }
    return
  }

  loading.value = true
  feedback.value = null

  const { error } = await client.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  })

  loading.value = false

  if (error) {
    feedback.value = { type: 'error', text: error.message }
    return
  }

  feedback.value = {
    type: 'success',
    text: 'Sprawdź swoją skrzynkę e-mail, wysłaliśmy link do logowania!',
  }
}

async function signOut() {
  loading.value = true
  feedback.value = null
  const { error } = await client.auth.signOut()
  loading.value = false
  if (error) {
    feedback.value = { type: 'error', text: error.message }
    return
  }
  email.value = ''
}
</script>

<template>
  <section
    class="shrink-0 border-b border-slate-100 px-4 py-3 md:px-5"
    aria-label="Logowanie"
  >
    <div v-if="!isHydrated" class="h-14 animate-pulse rounded-xl bg-slate-100" />

    <div
      v-else-if="isLoggedIn"
      class="flex items-center justify-between gap-2 rounded-xl bg-sky-50/80 px-3 py-2.5 ring-1 ring-sky-100"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-malta-sea text-white"
        >
          <User class="h-4 w-4" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-slate-900">
            {{ user?.email }}
          </span>
          <span class="text-[10px] text-slate-500">Zalogowany</span>
        </span>
      </span>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white/80 disabled:opacity-50"
        :disabled="loading"
        @click="signOut"
      >
        <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <LogOut v-else class="h-3.5 w-3.5" aria-hidden="true" />
        Wyloguj się
      </button>
    </div>

    <form v-else class="space-y-2" @submit.prevent="sendMagicLink">
      <p class="text-xs font-medium text-slate-600">Zaloguj się Magic Linkiem</p>
      <div class="relative">
        <Mail
          class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="auth-widget-email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          placeholder="twoj@email.com"
          class="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
        />
      </div>
      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
      >
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <LogIn v-else class="h-4 w-4" aria-hidden="true" />
        {{ loading ? 'Wysyłanie…' : 'Wyślij Magic Link' }}
      </button>
      <p
        v-if="feedback"
        class="rounded-lg px-2.5 py-2 text-xs leading-relaxed"
        :class="
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-red-50 text-red-700'
        "
        role="status"
      >
        {{ feedback.text }}
      </p>
    </form>
  </section>
</template>
