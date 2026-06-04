import type { Place, PlaceCategory } from '~/types/place'

export const placeCategoryFilters: { id: PlaceCategory; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'beach', label: 'Plaże' },
  { id: 'food', label: 'Jedzenie' },
  { id: 'coupon', label: 'Kupony' },
]

export function usePlaceFilter(places: Ref<Place[]>) {
  const activeCategory = ref<PlaceCategory>('all')

  const filteredPlaces = computed(() => {
    if (activeCategory.value === 'all') {
      return places.value
    }
    return places.value.filter((p) => p.category === activeCategory.value)
  })

  function setCategory(category: PlaceCategory) {
    activeCategory.value = category
  }

  return {
    activeCategory,
    filteredPlaces,
    setCategory,
    filters: placeCategoryFilters,
  }
}
