<script setup lang="ts">
import type { Place } from '~/types/place'
import { placesToMapPins } from '~/utils/mapPins'

definePageMeta({
  layout: false,
})

const { places, loading, usingMock, fetchPlaces } = usePlaces()
const { activeCategory, filteredPlaces, setCategory } = usePlaceFilter(places)

const selectedPlaceId = ref<string | null>(null)
const mapRef = ref<{ flyToPin: (id: string) => void } | null>(null)

/** Wszystkie pinezki na mapie; sidebar nadal filtruje listę */
const mapPins = computed(() => placesToMapPins(places.value))

const closeMobileDrawer = inject<(() => void) | undefined>('closeMobileDrawer', undefined)

function onSelectPlace(place: Place) {
  selectedPlaceId.value = place.id
  mapRef.value?.flyToPin(place.id)
  closeMobileDrawer?.()
}

function onPinClick(pin: { id: string }) {
  selectedPlaceId.value = pin.id
}

function onPlaceAdded(placeId: string) {
  selectedPlaceId.value = placeId
  mapRef.value?.flyToPin(placeId)
}

onMounted(() => {
  fetchPlaces()
})
</script>

<template>
  <NuxtLayout name="default" class="h-full min-h-0 w-full">
    <template #sidebar>
      <Sidebar
        :filtered-places="filteredPlaces"
        :active-category="activeCategory"
        :loading="loading"
        :using-mock="usingMock"
        :selected-place-id="selectedPlaceId"
        @update:active-category="setCategory"
        @select-place="onSelectPlace"
      />
    </template>

    <div class="h-full min-h-0 w-full">
      <ClientOnly>
        <Map
          ref="mapRef"
          class="h-full w-full"
          :pins="mapPins"
          :center="[14.4452, 35.8989]"
          :zoom="11"
          :selected-pin-id="selectedPlaceId"
          @pin-click="onPinClick"
          @place-added="onPlaceAdded"
        />
        <template #fallback>
          <div
            class="flex h-full min-h-[280px] w-full items-center justify-center bg-slate-200 text-sm text-slate-500"
          >
            Ładowanie mapy…
          </div>
        </template>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>
