# Malta Maps

Interaktywna mapa Malty z atrakcjami i kodami promocyjnymi — starter **Nuxt 3**, **Vue 3 Composition API**, **Mapbox GL JS**, **Tailwind CSS**, **Supabase**.

## Szybki start

```bash
npm install
cp .env.example .env
# Uzupełnij MAPBOX_ACCESS_TOKEN (wymagane do mapy)
npm run dev
```

**macOS:** jeśli `nuxt dev` kończy się błędem `Failed to restrict vite-node socket permissions`, skrypt `dev` ustawia już `TMPDIR=/tmp` (krótsza ścieżka socketa). Ręcznie: `TMPDIR=/tmp yarn dev`.

### Błąd `#app-manifest` / pusta mapa

1. Zatrzymaj dev server (`Ctrl+C`).
2. Wygeneruj ponownie katalog Nuxt i wyczyść cache Vite:

```bash
rm -rf .nuxt node_modules/.cache
yarn install   # uruchomi postinstall → nuxt prepare
yarn dev       # przed dev odpala predev → nuxt prepare
```

3. Upewnij się, że w `.env` jest token Mapbox (`MAPBOX_ACCESS_TOKEN` lub `NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN`).
4. Odśwież stronę twardo (Cmd+Shift+R).

Aplikacja: [http://localhost:3000](http://localhost:3000)

## Zmienne środowiskowe

| Zmienna | Opis |
|---------|------|
| `MAPBOX_ACCESS_TOKEN` | Token z [Mapbox](https://account.mapbox.com/access-tokens/) |
| `SUPABASE_URL` | URL projektu Supabase |
| `SUPABASE_KEY` | Klucz anon (lub service role do odczytu `places`) |

Bez Supabase działają **3 mockowe pinezki** (Valletta, Blue Lagoon, Mdina).

## Struktura

- `layouts/default.vue` — sidebar (desktop) + szuflada od dołu (mobile) + mapa
- `pages/index.vue` — strona główna
- `components/Map.vue` — Mapbox, markery, popup z kodem promocyjnym
- `components/Sidebar.vue` — filtry i lista miejsc
- `composables/usePlaces.ts` — pobieranie z Supabase + komentarz SQL tabeli `places`

## Baza Supabase

Schemat tabeli `places` — w komentarzu w `composables/usePlaces.ts`.

## Logowanie (e-mail + hasło)

Komponent **`components/AuthWidget.vue`** jest wpięty w **Sidebar** (pod nagłówkiem „Malta Maps”).

1. W Supabase: **Authentication → Providers → Email** — włącz logowanie e-mailem (opcjonalnie wyłącz „Confirm email” na dev).
2. Użytkownik loguje się (`signInWithPassword`) lub rejestruje (`signUp`).
3. Po zalogowaniu `useSupabaseUser()` odblokowuje przycisk „＋ Dodaj miejsce” na mapie.

**Dodawanie pinezek:** przycisk „＋ Dodaj miejsce” na mapie widoczny tylko po zalogowaniu (`useSupabaseUser()` w `Map.client.vue`).

### Prywatne i publiczne miejsca (`is_public`, `user_id`)

- **Gość:** widzi tylko `is_public = true`.
- **Zalogowany:** publiczne + własne prywatne (filtr `.or()` w `usePlaces.ts`).
- **Nowe pinezki:** zapis z `user_id`, `is_public: false` oraz `request_public` (checkbox w formularzu). Admin po akceptacji ustawia `is_public: true`.
- **Mapa:** prywatne markery mają `opacity-75` i ikonę kłódki.

## Stack

- Nuxt 3, TypeScript
- Tailwind CSS (`@nuxtjs/tailwindcss`)
- Ikony: Lucide Vue (`lucide-vue-next`)
- Mapbox GL JS
- `@nuxtjs/supabase` (auth + dane)
