import { mockPlaces } from '~/data/mockPlaces'
import type { NewPlaceInput, Place } from '~/types/place'

const PLACE_COLUMNS =
  'id, name, description, lat, lng, category, promo_code, image_url, user_id, is_public, request_public'

/**
 * ```sql
 * create table public.places (
 *   id          uuid primary key default gen_random_uuid(),
 *   user_id     uuid references auth.users(id) default auth.uid(),
 *   name        text not null,
 *   description text not null,
 *   lat         double precision not null,
 *   lng         double precision not null,
 *   category    text not null check (category in ('beach', 'food', 'coupon')),
 *   promo_code  text,
 *   image_url   text,
 *   is_public       boolean not null default false,
 *   request_public  boolean not null default false,
 *   created_at      timestamptz default now()
 * );
 *
 * -- Migracja (jeśli tabela już istnieje):
 * alter table public.places add column if not exists request_public boolean not null default false;
 *
 * -- SELECT: publiczne LUB własne prywatne
 * create policy "Read public or own places"
 *   on public.places for select using (
 *     is_public = true or auth.uid() = user_id
 *   );
 *
 * -- INSERT: tylko zalogowany, własny user_id
 * create policy "Users insert own places"
 *   on public.places for insert with check (auth.uid() = user_id);
 * ```
 */
export function usePlaces() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const places = useState<Place[]>('malta-places', () => [...mockPlaces])
  const loading = useState('malta-places-loading', () => false)
  const error = useState<string | null>('malta-places-error', () => null)
  const usingMock = useState('malta-places-mock', () => true)

  function buildPlacesQuery() {
    let query = client.from('places').select(PLACE_COLUMNS).order('name')

    const uid = user.value?.id
    if (uid) {
      query = query.or(`is_public.eq.true,and(is_public.eq.false,user_id.eq.${uid})`)
    } else {
      query = query.eq('is_public', true)
    }

    return query
  }

  async function fetchPlaces() {
    if (!import.meta.client) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await buildPlacesQuery()

      if (fetchError) {
        throw fetchError
      }

      if (data) {
        places.value = data as Place[]
        usingMock.value = false
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Nie udało się pobrać miejsc'
      error.value = message
      places.value = [...mockPlaces]
      usingMock.value = true
    } finally {
      loading.value = false
    }
  }

  async function createPlace(input: NewPlaceInput): Promise<Place> {
    // is_public: true dopiero po akceptacji admina; request_public = prośba użytkownika
    const payload = {
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      lat: input.lat,
      lng: input.lng,
      promo_code: input.promo_code?.trim() || null,
      image_url: input.image_url?.trim() || null,
      user_id: input.user_id,
      is_public: false,
      request_public: input.request_public,
    }

    const { data, error: insertError } = await client
      .from('places')
      .insert([payload] as never)
      .select(PLACE_COLUMNS)
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    if (!data) {
      throw new Error('Brak danych zwróconych po zapisie')
    }

    const place = data as Place
    places.value = [...places.value, place].sort((a, b) => a.name.localeCompare(b.name))
    usingMock.value = false
    error.value = null
    return place
  }

  if (import.meta.client) {
    watch(user, () => {
      fetchPlaces()
    })
  }

  return {
    places,
    loading,
    error,
    usingMock,
    fetchPlaces,
    createPlace,
  }
}
