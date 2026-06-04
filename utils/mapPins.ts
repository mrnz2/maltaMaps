import type { MapPin } from '~/types/place'
import type { Place } from '~/types/place'

export function placesToMapPins(places: Place[]): MapPin[] {
  return places.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    lat: p.lat,
    lng: p.lng,
    category: p.category,
    promoCode: p.promo_code,
    imageUrl: p.image_url ?? null,
    isPublic: p.is_public,
  }))
}
