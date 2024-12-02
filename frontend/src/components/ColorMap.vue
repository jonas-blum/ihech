<script setup lang="ts">
import { defineProps, computed, ref, watch } from 'vue'
import { ColorMap, Breakpoint } from '@/classes/ColorMap'
import { ColoringHeatmapEnum, mapColoringHeatmapEnum } from '@/helpers/helpers'
import { useMainStore } from '@/stores/mainStore'

const mainStore = useMainStore()

// Compute the CSS gradient string based on the breakpoints of the color map
const gradientStyle = ref('')

const updateGradientStyle = () => {
  const gradient = mainStore.colorMap.breakpoints
    .map(
      (breakpoint: Breakpoint) =>
        `#${breakpoint.color.toString(16).padStart(6, '0')} ${breakpoint.value}%`,
    )
    .join(', ')
  gradientStyle.value = `linear-gradient(to right, ${gradient})`
}

// Watch for changes in the colorMap breakpoints and update the gradient style
watch(
  () => mainStore.colorMap.breakpoints,
  () => {
    updateGradientStyle()
  },
  { deep: true, immediate: true },
)

const templateBreakpoint = ref(new Breakpoint(0, 0))
const breakpointFormOpen = ref(false)

const toggleBreakpointForm = () => {
  breakpointFormOpen.value = !breakpointFormOpen.value
}

const onCreateBreakpoint = () => {
  const newBreakpoint = new Breakpoint(templateBreakpoint.value.value, templateBreakpoint.value.color)
  mainStore.colorMap.addBreakpoint(newBreakpoint)

  toggleBreakpointForm()
}
</script>
<template>
  <details class="collapse w-full p-2 rounded-none bg-white -translate-y-2">
    <summary class="collapse-title p-0 rounded-none h-[30px] min-h-[20px]">
      <div class="w-full h-[20px]" :style="{ background: gradientStyle }"></div>
      <div class="w-full flex justify-between text-xs">
        <span>{{ mainStore.colorMap.getLowestBreakpoint()?.value ?? '' }}</span>
        <span>{{ mainStore.colorMap.getHighestBreakpoint()?.value ?? '' }}</span>
      </div>
    </summary>

    <!-- Dropdown content -->
    <div
      class="collapse-content rounded-sm w-full p-2 text-sm bg-white"
    >
      <div
        v-for="(breakpoint, index) in mainStore.colorMap.breakpoints"
        :key="index"
        class="flex gap-2 items-center justify-between mb-2"
      >
        <input
          type="number"
          class="input input-bordered input-xs w-16"
          :value="breakpoint.value"
          @click.stop
          @input="
            (payload: Event) =>
              breakpoint.setValue(parseInt((payload.target as HTMLInputElement).value))
          "
        />
        <input
          type="color"
          class="w-8 h-[1rem]"
          :value="`#${breakpoint.color.toString(16).padStart(6, '0')}`"
          @click.stop
          @input="
            (payload: Event) =>
              breakpoint.setColor(parseInt((payload.target as HTMLInputElement).value.slice(1), 16))
          "
        />
        <button @click.stop="mainStore.colorMap.removeBreakpoint(breakpoint)" class="btn btn-xs">
          Remove
        </button>
      </div>
      <button
        v-if="!breakpointFormOpen"
        @click.stop="toggleBreakpointForm"
        class="btn btn-xs btn-block"
      >
        New Breakpoint
      </button>
      <div v-else class="flex gap-2 items-center justify-between mb-2">
        <input
          type="number"
          class="input input-bordered input-xs w-16"
          v-model="templateBreakpoint.value"
          @click.stop
        />
        <input type="color" class="w-8 h-[1rem]" v-model="templateBreakpoint.color" @click.stop />
        <button @click.stop="onCreateBreakpoint" class="btn btn-xs">Create</button>
      </div>

    </div>
  </details>
</template>

<style scoped lang="scss">
// .custom-shadow {
//   box-shadow: 0px 0px 3px 1px rgba(0, 0, 0, 0.5);
// }

// // this is to make the dropdown appear below the summary
// details {
//   overflow: visible
// }
// details[open] .collapse-content {
//   position: absolute;
//   top: 100%; /* Align dropdown to appear below */
//   left: 0;
// }
</style>
