<script setup lang="ts">
import { KeyRound, Loader2, LogIn, LogOut, Mail, User, UserPlus } from 'lucide-vue-next'

const user = useSupabaseUser()
const client = useSupabaseClient()

const isLoginView = ref(true)
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

const isHydrated = ref(false)

const MIN_PASSWORD_LENGTH = 6

onMounted(() => {
  isHydrated.value = true
})

const isLoggedIn = computed(() => isHydrated.value && !!user.value)

function clearMessages() {
  errorMsg.value = ''
  successMsg.value = ''
}

function switchView(toLogin: boolean) {
  isLoginView.value = toLogin
  clearMessages()
}

async function handleAuth() {
  clearMessages()

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    errorMsg.value = 'Podaj adres e-mail.'
    return
  }

  if (!password.value) {
    errorMsg.value = 'Podaj hasło.'
    return
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    errorMsg.value = `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`
    return
  }

  loading.value = true

  try {
    if (isLoginView.value) {
      const { error } = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password: password.value,
      })

      if (error) {
        errorMsg.value = error.message
        return
      }

      successMsg.value = 'Zalogowano pomyślnie.'
      password.value = ''
    } else {
      const { error } = await client.auth.signUp({
        email: trimmedEmail,
        password: password.value,
      })

      if (error) {
        errorMsg.value = error.message
        return
      }

      successMsg.value =
        'Konto utworzone. Jeśli włączona jest weryfikacja e-mail, sprawdź skrzynkę i potwierdź rejestrację.'
      password.value = ''
    }
  } finally {
    loading.value = false
  }
}

async function signOut() {
  loading.value = true
  clearMessages()

  const { error } = await client.auth.signOut()
  loading.value = false

  if (error) {
    errorMsg.value = error.message
    return
  }

  email.value = ''
  password.value = ''
  isLoginView.value = true
}
</script>

<template>
  <section
    class="shrink-0 border-b border-slate-100 px-4 py-3 md:px-5"
    aria-label="Logowanie"
  >
    <div v-if="!isHydrated" class="h-28 animate-pulse rounded-xl bg-slate-100" />

    <!-- Zalogowany -->
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

    <!-- Logowanie / rejestracja -->
    <form v-else class="space-y-3" @submit.prevent="handleAuth">
      <p class="text-xs font-semibold text-slate-700">
        {{ isLoginView ? 'Logowanie' : 'Rejestracja' }}
      </p>

      <div>
        <label for="auth-email" class="mb-1 block text-xs font-medium text-slate-500">
          E-mail
        </label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="auth-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="twoj@email.com"
            class="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
          />
        </div>
      </div>

      <div>
        <label for="auth-password" class="mb-1 block text-xs font-medium text-slate-500">
          Hasło
        </label>
        <div class="relative">
          <KeyRound
            class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="auth-password"
            v-model="password"
            type="password"
            :autocomplete="isLoginView ? 'current-password' : 'new-password'"
            required
            :minlength="MIN_PASSWORD_LENGTH"
            placeholder="••••••••"
            class="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
          />
        </div>
      </div>

      <p
        v-if="errorMsg"
        class="rounded-lg bg-red-50 px-2.5 py-2 text-xs leading-relaxed text-red-700"
        role="alert"
      >
        {{ errorMsg }}
      </p>
      <p
        v-if="successMsg"
        class="rounded-lg bg-emerald-50 px-2.5 py-2 text-xs leading-relaxed text-emerald-800"
        role="status"
      >
        {{ successMsg }}
      </p>

      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
      >
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <LogIn v-else-if="isLoginView" class="h-4 w-4" aria-hidden="true" />
        <UserPlus v-else class="h-4 w-4" aria-hidden="true" />
        {{
          loading
            ? 'Proszę czekać…'
            : isLoginView
              ? 'Zaloguj się'
              : 'Zarejestruj się'
        }}
      </button>

      <button
        type="button"
        class="w-full text-center text-xs text-malta-sea hover:text-sky-700 hover:underline"
        @click="switchView(!isLoginView)"
      >
        {{
          isLoginView
            ? 'Nie masz konta? Zarejestruj się'
            : 'Masz już konto? Zaloguj się'
        }}
      </button>
    </form>
  </section>
</template>
