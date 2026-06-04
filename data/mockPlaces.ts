import type { Place } from '~/types/place'

/** Przykładowe pinezki na Malcie — działają bez połączenia z Supabase */
export const mockPlaces: Place[] = [
  {
    id: 'valletta',
    name: 'Valletta — Stolica',
    description:
      'Barokowe miasto-forteca wpisane na listę UNESCO. Spaceruj po uliczkach, odwiedź katedrę św. Jana i tarasy nad portem.',
    lat: 35.8989,
    lng: 14.5146,
    category: 'food',
    promo_code: 'VALLETTA10',
    image_url: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=640&q=80',
    user_id: null,
    is_public: true,
    request_public: false,
  },
  {
    id: 'blue-lagoon',
    name: 'Blue Lagoon — Comino',
    description:
      'Krystalicznie czysta laguna między Comino a Cominotto. Idealna na snorkeling i rejs łodzią z Mellieħa lub Marfa.',
    lat: 36.0132,
    lng: 14.3236,
    category: 'beach',
    promo_code: 'LAGOON15',
    image_url: 'https://images.unsplash.com/photo-1539650116574-750c20768742?w=640&q=80',
    user_id: null,
    is_public: true,
    request_public: false,
  },
  {
    id: 'mdina',
    name: 'Mdina — Ciche Miasto',
    description:
      'Średniowieczne miasto w murach z panoramicznymi widokami na wyspę. Wąskie uliczki, pałace i kawiarnie w cieniu.',
    lat: 35.8858,
    lng: 14.4031,
    category: 'coupon',
    promo_code: 'MDINA20',
    image_url: 'https://images.unsplash.com/photo-1577587231917-9ce28425be62?w=640&q=80',
    user_id: null,
    is_public: true,
    request_public: false,
  },
]
