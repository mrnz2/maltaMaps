export type PlaceCategory = 'all' | 'beach' | 'food' | 'coupon'

export interface Place {
  id: string
  name: string
  description: string
  lat: number
  lng: number
  category: Exclude<PlaceCategory, 'all'>
  promo_code: string | null
  image_url?: string | null
  user_id: string | null
  is_public: boolean
  /** Użytkownik poprosił o publikację (oczekuje na moderację admina) */
  request_public: boolean
}

export type MapPinCategory = Exclude<PlaceCategory, 'all'>

export interface MapPin {
  id: string
  name: string
  description: string
  lat: number
  lng: number
  category: MapPinCategory
  promoCode: string | null
  imageUrl?: string | null
  isPublic: boolean
}

export interface NewPlaceInput {
  name: string
  description: string
  category: MapPinCategory
  promo_code: string | null
  image_url: string | null
  lat: number
  lng: number
  /** Zaznaczenie w formularzu — zapis do kolumny request_public */
  request_public: boolean
  user_id: string
}
