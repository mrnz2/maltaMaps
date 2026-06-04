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
}

export interface NewPlaceInput {
  name: string
  description: string
  category: MapPinCategory
  promo_code: string | null
  image_url: string | null
  lat: number
  lng: number
}
