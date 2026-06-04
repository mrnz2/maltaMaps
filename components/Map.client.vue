<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import { Loader2, Lock, MapPin as MapPinIcon, Plus, X } from 'lucide-vue-next'
import type { MapPin, MapPinCategory } from '~/types/place'

declare global {
  interface Window {
    copyPromoCode?: (code: string, buttonId: string) => void | Promise<void>
  }
}

const props = withDefaults(
  defineProps<{
    pins?: MapPin[]
    center?: [number, number]
    zoom?: number
    selectedPinId?: string | null
    autoGeolocate?: boolean
  }>(),
  {
    pins: () => [],
    center: () => [14.4452, 35.8989],
    zoom: 11,
    selectedPinId: null,
    autoGeolocate: true,
  },
)

const emit = defineEmits<{
  pinClick: [pin: MapPin]
  placeAdded: [placeId: string]
}>()

const { createPlace } = usePlaces()

/** Stan sesji — @nuxtjs/supabase */
const user = useSupabaseUser()
const isAuthHydrated = ref(false)

const config = useRuntimeConfig()
const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<mapboxgl.Map | null>(null)
const geolocateControl = shallowRef<mapboxgl.GeolocateControl | null>(null)
const markersById = new Map<string, mapboxgl.Marker>()
const markerSignatures = new Map<string, string>()

const isAddingMode = ref(false)
const temporaryMarker = shallowRef<mapboxgl.Marker | null>(null)
const isSaving = ref(false)
const formError = ref<string | null>(null)

const newPlaceForm = reactive({
  name: '',
  description: '',
  category: 'beach' as MapPinCategory,
  promo_code: '',
  image_url: '',
  lat: null as number | null,
  lng: null as number | null,
})

const showFormPanel = computed(
  () => newPlaceForm.lat !== null && newPlaceForm.lng !== null,
)

const categoryOptions: { value: MapPinCategory; label: string }[] = [
  { value: 'beach', label: 'Plaża' },
  { value: 'food', label: 'Jedzenie' },
  { value: 'coupon', label: 'Kupon' },
]

const TEMP_MARKER_CLASS =
  'flex h-11 w-11 cursor-crosshair items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg ring-4 ring-emerald-400/40 animate-pulse'

const ICONS: Record<MapPinCategory, string> = {
  beach: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2c1.3 0 1.9-.5 2.5-1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2c1.3 0 1.9-.5 2.5-1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2c1.3 0 1.9-.5 2.5-1"/></svg>`,
  food: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>`,
  coupon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
}

const MARKER_CLASSES: Record<MapPinCategory, string> = {
  beach:
    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-sky-500 shadow-lg ring-2 ring-sky-400/50 transition-transform duration-200 hover:scale-110 active:scale-95',
  food:
    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-orange-500 shadow-lg ring-2 ring-orange-400/50 transition-transform duration-200 hover:scale-110 active:scale-95',
  coupon:
    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-lg ring-2 ring-amber-400/50 transition-transform duration-200 hover:scale-110 active:scale-95',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeJsString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
}

function safeImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return escapeHtml(url)
    }
  } catch {
    return null
  }
  return null
}

function pinSignature(pin: MapPin): string {
  return JSON.stringify({
    lat: pin.lat,
    lng: pin.lng,
    category: pin.category,
    name: pin.name,
    description: pin.description,
    promoCode: pin.promoCode,
    imageUrl: pin.imageUrl,
  })
}

function resetNewPlaceForm() {
  newPlaceForm.name = ''
  newPlaceForm.description = ''
  newPlaceForm.category = 'beach'
  newPlaceForm.promo_code = ''
  newPlaceForm.image_url = ''
  newPlaceForm.lat = null
  newPlaceForm.lng = null
  formError.value = null
}

function removeTemporaryMarker() {
  temporaryMarker.value?.remove()
  temporaryMarker.value = null
}

function createTemporaryMarkerElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = TEMP_MARKER_CLASS
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
  return el
}

function placeTemporaryMarker(lng: number, lat: number) {
  const map = mapInstance.value
  if (!map) return

  if (temporaryMarker.value) {
    temporaryMarker.value.setLngLat([lng, lat])
    return
  }

  temporaryMarker.value = new mapboxgl.Marker({
    element: createTemporaryMarkerElement(),
    anchor: 'bottom',
  })
    .setLngLat([lng, lat])
    .addTo(map)
}

function handleMapClick(e: mapboxgl.MapMouseEvent) {
  if (!user.value) return
  if (!isAddingMode.value) return

  const { lng, lat } = e.lngLat
  newPlaceForm.lng = lng
  newPlaceForm.lat = lat
  formError.value = null
  placeTemporaryMarker(lng, lat)
}

function setMapCursor(cursor: string) {
  const canvas = mapInstance.value?.getCanvas()
  if (canvas) canvas.style.cursor = cursor
}

function cancelAddingMode() {
  isAddingMode.value = false
  removeTemporaryMarker()
  resetNewPlaceForm()
  setMapCursor('')
}

function toggleAddingMode() {
  if (!user.value) return

  if (isAddingMode.value) {
    cancelAddingMode()
    return
  }
  isAddingMode.value = true
  formError.value = null
  setMapCursor('crosshair')
}

function validateForm(): string | null {
  if (newPlaceForm.lat === null || newPlaceForm.lng === null) {
    return 'Kliknij na mapę, aby wybrać lokalizację.'
  }
  if (!newPlaceForm.name.trim()) {
    return 'Nazwa jest wymagana.'
  }
  if (!newPlaceForm.description.trim()) {
    return 'Opis jest wymagany.'
  }
  if (newPlaceForm.image_url.trim()) {
    try {
      const parsed = new URL(newPlaceForm.image_url.trim())
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return 'Adres zdjęcia musi zaczynać się od http:// lub https://'
      }
    } catch {
      return 'Nieprawidłowy adres URL zdjęcia.'
    }
  }
  return null
}

async function submitNewPlace() {
  if (!user.value) return

  const validationError = validateForm()
  if (validationError) {
    formError.value = validationError
    return
  }

  isSaving.value = true
  formError.value = null

  try {
    const place = await createPlace({
      name: newPlaceForm.name,
      description: newPlaceForm.description,
      category: newPlaceForm.category,
      promo_code: newPlaceForm.promo_code.trim() || null,
      image_url: newPlaceForm.image_url.trim() || null,
      lat: newPlaceForm.lat!,
      lng: newPlaceForm.lng!,
    })

    removeTemporaryMarker()
    resetNewPlaceForm()
    isAddingMode.value = false
    setMapCursor('')
    emit('placeAdded', place.id)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Nie udało się zapisać miejsca'
  } finally {
    isSaving.value = false
  }
}

function createMarkerElement(pin: MapPin): HTMLDivElement {
  const category: MapPinCategory =
    pin.category === 'food' || pin.category === 'coupon' ? pin.category : 'beach'
  const el = document.createElement('div')
  el.className = MARKER_CLASSES[category]
  el.setAttribute('role', 'button')
  el.setAttribute('aria-label', pin.name)
  el.innerHTML = ICONS[category]
  return el
}

function buildPopupHtml(pin: MapPin): string {
  const imageSrc = safeImageUrl(pin.imageUrl)
  const imageBlock = imageSrc
    ? `<img src="${imageSrc}" alt="${escapeHtml(pin.name)}" class="h-24 w-full object-cover" loading="lazy" />`
    : ''

  const promoBlock = pin.promoCode
    ? (() => {
        const btnId = `copy-promo-${pin.id}`
        const codeJs = escapeJsString(pin.promoCode)
        return `
          <div class="mt-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-800/80">Kod promocyjny</p>
            <p class="mt-1 font-mono text-sm font-bold tracking-wide text-amber-950">${escapeHtml(pin.promoCode)}</p>
            <button
              id="${btnId}"
              type="button"
              class="mt-2 w-full rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 active:bg-amber-700"
              onclick="window.copyPromoCode && window.copyPromoCode('${codeJs}', '${btnId}')"
            >
              Kopiuj kod
            </button>
          </div>`
      })()
    : ''

  return `
    <article class="overflow-hidden rounded-xl bg-white text-left shadow-none">
      ${imageBlock}
      <div class="p-4">
        <h3 class="pr-6 text-base font-bold leading-snug text-slate-900">${escapeHtml(pin.name)}</h3>
        <p class="mt-1.5 text-sm leading-relaxed text-slate-500">${escapeHtml(pin.description)}</p>
        ${promoBlock}
      </div>
    </article>
  `
}

function createPopup(pin: MapPin): mapboxgl.Popup {
  return new mapboxgl.Popup({
    offset: 32,
    closeButton: true,
    maxWidth: '300px',
    className: 'malta-map-popup',
  }).setHTML(buildPopupHtml(pin))
}

function removeMarker(id: string) {
  const marker = markersById.get(id)
  marker?.remove()
  markersById.delete(id)
  markerSignatures.delete(id)
}

function openMarkerPopup(marker: mapboxgl.Marker) {
  const popup = marker.getPopup()
  if (!popup) return
  if (!popup.isOpen()) {
    marker.togglePopup()
  }
}

function addMarker(pin: MapPin, map: mapboxgl.Map) {
  const popup = createPopup(pin)
  const marker = new mapboxgl.Marker({ element: createMarkerElement(pin), anchor: 'bottom' })
    .setLngLat([pin.lng, pin.lat])
    .setPopup(popup)
    .addTo(map)

  marker.getElement().addEventListener('click', (ev) => {
    ev.stopPropagation()
    openMarkerPopup(marker)
    emit('pinClick', pin)
  })

  markersById.set(pin.id, marker)
  markerSignatures.set(pin.id, pinSignature(pin))
}

function syncMarkers() {
  const map = mapInstance.value
  if (!map) return

  const pinIds = new Set(props.pins.map((p) => p.id))

  for (const id of [...markersById.keys()]) {
    if (!pinIds.has(id)) removeMarker(id)
  }

  for (const pin of props.pins) {
    const signature = pinSignature(pin)
    const existing = markersById.get(pin.id)

    if (existing) {
      if (markerSignatures.get(pin.id) === signature) {
        existing.setLngLat([pin.lng, pin.lat])
        continue
      }
      removeMarker(pin.id)
    }

    addMarker(pin, map)
  }
}

function flyToPin(pinId: string) {
  const pin = props.pins.find((p) => p.id === pinId)
  const map = mapInstance.value
  const marker = markersById.get(pinId)
  if (!pin || !map) return

  map.flyTo({
    center: [pin.lng, pin.lat],
    zoom: 14,
    essential: true,
  })
  if (marker) openMarkerPopup(marker)
}

function addMapControls(map: mapboxgl.Map) {
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserLocation: true,
    showAccuracyCircle: true,
  })

  map.addControl(geolocate, 'bottom-right')
  geolocateControl.value = geolocate

  geolocate.on('error', (err) => {
    console.warn('[Map] Geolokalizacja:', err.message)
  })
}

function requestUserLocation() {
  const geolocate = geolocateControl.value
  if (!geolocate) return
  setTimeout(() => geolocate.trigger(), 300)
}

function registerCopyPromoHandler() {
  window.copyPromoCode = async (code: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      const btn = document.getElementById(buttonId)
      if (btn) {
        const original = btn.textContent
        btn.textContent = 'Skopiowano!'
        btn.classList.add('!bg-emerald-500', 'hover:!bg-emerald-600')
        setTimeout(() => {
          btn.textContent = original ?? 'Kopiuj kod'
          btn.classList.remove('!bg-emerald-500', 'hover:!bg-emerald-600')
        }, 2000)
      }
    } catch {
      console.warn('[Map] Nie udało się skopiować kodu do schowka')
    }
  }
}

function initMap() {
  const token = config.public.mapboxAccessToken
  if (!token) {
    console.warn('[Map] Ustaw MAPBOX_ACCESS_TOKEN w pliku .env')
    return
  }

  if (!mapContainer.value) return

  mapboxgl.accessToken = token

  const map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: props.center,
    zoom: props.zoom,
    attributionControl: true,
  })

  addMapControls(map)
  map.on('click', handleMapClick)

  map.on('load', () => {
    syncMarkers()
    if (props.autoGeolocate) requestUserLocation()
  })

  mapInstance.value = map
}

watch(
  () => props.pins,
  () => {
    if (mapInstance.value?.loaded()) syncMarkers()
  },
  { deep: true },
)

watch(
  () => props.selectedPinId,
  (id) => {
    if (id) flyToPin(id)
  },
)

watch(isAddingMode, (active) => {
  if (!active) setMapCursor('')
  else if (mapInstance.value) setMapCursor('crosshair')
})

watch(user, (currentUser) => {
  if (!currentUser && isAddingMode.value) cancelAddingMode()
})

onMounted(async () => {
  isAuthHydrated.value = true
  registerCopyPromoHandler()
  await nextTick()
  initMap()
  mapInstance.value?.resize()
})

onBeforeUnmount(() => {
  markersById.forEach((m) => m.remove())
  markersById.clear()
  markerSignatures.clear()
  removeTemporaryMarker()
  delete window.copyPromoCode
  geolocateControl.value = null
  mapInstance.value?.remove()
  mapInstance.value = null
})

defineExpose({ flyToPin, requestUserLocation, toggleAddingMode })
</script>

<template>
  <div class="relative h-full w-full min-h-[280px] bg-slate-200">
    <div
      v-if="!config.public.mapboxAccessToken"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-center"
    >
      <p class="text-sm font-medium text-slate-700">Brak tokenu Mapbox</p>
      <p class="text-xs text-slate-500 max-w-sm">
        Skopiuj <code class="rounded bg-slate-200 px-1">.env.example</code> do
        <code class="rounded bg-slate-200 px-1">.env</code> i ustaw
        <code class="rounded bg-slate-200 px-1">MAPBOX_ACCESS_TOKEN</code>.
      </p>
    </div>

    <!-- Dodawanie miejsc — UI zależne od sesji Supabase -->
    <div
      class="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[17rem] flex-col gap-2 md:left-4 md:top-4"
      role="region"
      aria-label="Dodawanie miejsca"
    >
      <!-- Zalogowany: przycisk trybu dodawania -->
      <template v-if="isAuthHydrated && user">
        <button
          type="button"
          class="pointer-events-auto inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold shadow-lg ring-1 transition-colors"
          :class="
            isAddingMode
              ? 'bg-red-500 text-white ring-red-600/30 hover:bg-red-600'
              : 'bg-white text-slate-800 ring-slate-200/80 hover:bg-slate-50'
          "
          @click="toggleAddingMode"
        >
          <X v-if="isAddingMode" class="h-4 w-4 shrink-0" aria-hidden="true" />
          <Plus v-else class="h-4 w-4 shrink-0 text-malta-sea" aria-hidden="true" />
          {{ isAddingMode ? 'Anuluj' : '＋ Dodaj miejsce' }}
        </button>

        <p
          v-if="isAddingMode && !showFormPanel"
          class="pointer-events-none rounded-lg bg-slate-900/80 px-2.5 py-1.5 text-xs text-white shadow-md backdrop-blur-sm"
        >
          Kliknij na mapę, aby ustawić pinezkę
        </p>
      </template>

      <!-- Gość: brak przycisku, boks informacyjny -->
      <div
        v-else-if="isAuthHydrated"
        class="pointer-events-auto flex items-start gap-2.5 rounded-xl bg-slate-100 px-3.5 py-3 shadow-md ring-1 ring-slate-200/90"
      >
        <span
          class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-slate-500"
        >
          <Lock class="h-4 w-4" aria-hidden="true" />
        </span>
        <p class="text-xs leading-relaxed text-slate-600">
          Zaloguj się, aby dodawać nowe miejsca i kody promocyjne na mapie Malty.
        </p>
      </div>
    </div>

    <!-- Panel formularza -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-x-2"
    >
      <aside
        v-if="showFormPanel && user"
        class="absolute bottom-0 left-0 right-0 z-20 max-h-[min(85vh,28rem)] overflow-y-auto rounded-t-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md md:bottom-auto md:left-4 md:right-auto md:top-16 md:max-h-[calc(100%-5rem)] md:w-[min(100%,22rem)] md:rounded-2xl"
        aria-label="Formularz nowego miejsca"
      >
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 class="text-base font-bold text-slate-900">Nowe miejsce</h2>
            <p class="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPinIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {{ newPlaceForm.lat?.toFixed(5) }}, {{ newPlaceForm.lng?.toFixed(5) }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Zamknij formularz"
            @click="cancelAddingMode"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="submitNewPlace">
          <div>
            <label for="place-name" class="mb-1 block text-xs font-medium text-slate-600">
              Nazwa <span class="text-red-500">*</span>
            </label>
            <input
              id="place-name"
              v-model="newPlaceForm.name"
              type="text"
              required
              maxlength="120"
              placeholder="np. Golden Bay"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
            />
          </div>

          <div>
            <label for="place-desc" class="mb-1 block text-xs font-medium text-slate-600">
              Opis <span class="text-red-500">*</span>
            </label>
            <textarea
              id="place-desc"
              v-model="newPlaceForm.description"
              required
              rows="3"
              maxlength="500"
              placeholder="Krótki opis atrakcji…"
              class="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
            />
          </div>

          <div>
            <label for="place-category" class="mb-1 block text-xs font-medium text-slate-600">
              Kategoria
            </label>
            <select
              id="place-category"
              v-model="newPlaceForm.category"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
            >
              <option
                v-for="opt in categoryOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="place-promo" class="mb-1 block text-xs font-medium text-slate-600">
              Kod promocyjny
            </label>
            <input
              id="place-promo"
              v-model="newPlaceForm.promo_code"
              type="text"
              maxlength="32"
              placeholder="Opcjonalnie"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
            />
          </div>

          <div>
            <label for="place-image" class="mb-1 block text-xs font-medium text-slate-600">
              URL zdjęcia
            </label>
            <input
              id="place-image"
              v-model="newPlaceForm.image_url"
              type="url"
              placeholder="https://…"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-malta-sea focus:outline-none focus:ring-1 focus:ring-malta-sea"
            />
          </div>

          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </p>

          <button
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-malta-sea px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSaving"
          >
            <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" aria-hidden="true" />
            {{ isSaving ? 'Zapisywanie…' : 'Zapisz pinezkę' }}
          </button>
        </form>
      </aside>
    </Transition>

    <div ref="mapContainer" class="h-full w-full" />
  </div>
</template>
