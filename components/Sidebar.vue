<script setup lang="ts">
import {
  Waves,
  UtensilsCrossed,
  Ticket,
  MapPin,
  LayoutGrid,
  Loader2,
  Database,
} from 'lucide-vue-next'
import type { Place, PlaceCategory } from '~/types/place'
import { placeCategoryFilters } from '~/composables/usePlaceFilter'

defineProps<{
  filteredPlaces: Place[]
  activeCategory: PlaceCategory
  loading?: boolean
  usingMock?: boolean
  selectedPlaceId?: string | null
}>()

const emit = defineEmits<{
  'update:activeCategory': [category: PlaceCategory]
  selectPlace: [place: Place]
}>()

const categoryIcons: Record<PlaceCategory, typeof LayoutGrid> = {
  all: LayoutGrid,
  beach: Waves,
  food: UtensilsCrossed,
  coupon: Ticket,
}

function onFilterClick(category: PlaceCategory) {
  emit('update:activeCategory', category)
}
</script>

<template>
  <aside
    class="flex h-full flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200/80 shadow-xl md:shadow-none"
  >
    <header class="shrink-0 border-b border-slate-100 px-4 py-4 md:px-5">
      <div class="flex items-center gap-2">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-malta-sea to-sky-700 text-white"
        >
          <MapPin class="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-slate-900">Malta Maps</h1>
          <p class="text-xs text-slate-500">Atrakcje i kupony</p>
        </div>
      </div>

      <p
        v-if="usingMock"
        class="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800"
      >
        <Database class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Dane demonstracyjne (podłącz Supabase)
      </p>
    </header>

    <AuthWidget />

    <section class="shrink-0 px-4 py-3 md:px-5" aria-label="Filtry kategorii">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Kategorie
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="filter in placeCategoryFilters"
          :key="filter.id"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            activeCategory === filter.id
              ? 'bg-malta-sea text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          "
          @click="onFilterClick(filter.id)"
        >
          <component
            :is="categoryIcons[filter.id]"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          />
          {{ filter.label }}
        </button>
      </div>
    </section>

    <section class="flex min-h-0 flex-1 flex-col px-4 pb-4 md:px-5 md:pb-5">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Miejsca ({{ filteredPlaces.length }})
      </p>

      <div
        v-if="loading"
        class="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500"
      >
        <Loader2 class="h-5 w-5 animate-spin" aria-hidden="true" />
        Ładowanie…
      </div>

      <ul
        v-else
        class="flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 -mr-1"
        role="list"
      >
        <li
          v-for="place in filteredPlaces"
          :key="place.id"
        >
          <button
            type="button"
            class="w-full rounded-xl border p-3 text-left transition-all"
            :class="
              selectedPlaceId === place.id
                ? 'border-malta-sea bg-sky-50 ring-1 ring-malta-sea/30'
                : 'border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white'
            "
            @click="emit('selectPlace', place)"
          >
            <span class="font-medium text-slate-900">{{ place.name }}</span>
            <p class="mt-0.5 line-clamp-2 text-xs text-slate-500">
              {{ place.description }}
            </p>
            <span
              v-if="place.promo_code"
              class="mt-2 inline-flex items-center gap-1 rounded-md bg-malta-sand/15 px-2 py-0.5 text-xs font-medium text-amber-800"
            >
              <Ticket class="h-3 w-3" aria-hidden="true" />
              Kupon
            </span>
          </button>
        </li>

        <li
          v-if="!loading && filteredPlaces.length === 0"
          class="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500"
        >
          Brak miejsc w tej kategorii.
        </li>
      </ul>
    </section>
  </aside>
</template>
