<script setup lang="ts">
import { ChevronUp, Map as MapIcon } from 'lucide-vue-next'

const drawerOpen = ref(false)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function closeDrawer() {
  drawerOpen.value = false
}

provide('closeMobileDrawer', closeDrawer)
</script>

<template>
  <div class="flex h-full w-full flex-col md:flex-row">
    <!-- Sidebar: jedna instancja (unika podwójnej hydratacji AuthBar / listy) -->
    <div
      class="hidden md:flex md:h-full md:w-[min(100%,22rem)] md:shrink-0 md:flex-col"
    >
      <slot name="sidebar" />
    </div>

    <main class="relative min-h-0 flex-1 flex flex-col">
      <slot />
    </main>

    <div class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col md:hidden">
      <button
        type="button"
        class="pointer-events-auto mx-auto mb-1 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-slate-200/80"
        :aria-expanded="drawerOpen"
        aria-controls="mobile-drawer"
        @click="toggleDrawer"
      >
        <MapIcon class="h-4 w-4 text-malta-sea" aria-hidden="true" />
        {{ drawerOpen ? 'Ukryj listę' : 'Atrakcje i filtry' }}
        <ChevronUp
          class="h-4 w-4 transition-transform duration-300"
          :class="drawerOpen ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>

      <div
        id="mobile-drawer"
        class="pointer-events-auto flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-[max-height] duration-300 ease-out border-t border-slate-200/80"
        :class="drawerOpen ? 'max-h-[min(70vh,32rem)]' : 'max-h-0'"
      >
        <div
          v-show="drawerOpen"
          class="h-[min(70vh,32rem)] overflow-hidden"
        >
          <slot name="sidebar" />
        </div>
      </div>
    </div>

    <!-- Przyciemnienie pod szufladą -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <button
        v-if="drawerOpen"
        type="button"
        class="md:hidden fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px]"
        aria-label="Zamknij panel"
        @click="closeDrawer"
      />
    </Transition>
  </div>
</template>
