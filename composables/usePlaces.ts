import { mockPlaces } from '~/data/mockPlaces'
import type { NewPlaceInput, Place } from '~/types/place'

/**
 * Struktura tabeli `places` w Supabase (PostgreSQL):
 *
 * ```sql
 * create table public.places (
 *   id          uuid primary key default gen_random_uuid(),
 *   name        text not null,
 *   description text not null,
 *   lat         double precision not null,
 *   lng         double precision not null,
 *   category    text not null check (category in ('beach', 'food', 'coupon')),
 *   promo_code  text,
 *   image_url   text,
 *   created_at  timestamptz default now()
 * );
 *
 * alter table public.places enable row level security;
 * create policy "Places are viewable by everyone"
 *   on public.places for select using (true);
 * create policy "Anyone can insert places"
 *   on public.places for insert with check (true);
 * ```
 */
export function usePlaces() {
  const client = useSupabaseClient()
  const places = useState<Place[]>('malta-places', () => [...mockPlaces])
  const loading = useState('malta-places-loading', () => false)
  const error = useState<string | null>('malta-places-error', () => null)
  const usingMock = useState('malta-places-mock', () => true)

  async function fetchPlaces() {
    if (!import.meta.client) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await client
        .from('places')
        .select('id, name, description, lat, lng, category, promo_code, image_url')
        .order('name')

      if (fetchError) {
        throw fetchError
      }

      if (data && data.length > 0) {
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
    const payload = {
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      lat: input.lat,
      lng: input.lng,
      promo_code: input.promo_code?.trim() || null,
      image_url: input.image_url?.trim() || null,
    }

    const { data, error: insertError } = await client
      .from('places')
      .insert([payload])
      .select('id, name, description, lat, lng, category, promo_code, image_url')
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

  return {
    places,
    loading,
    error,
    usingMock,
    fetchPlaces,
    createPlace,
  }
}
