<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { LinearColorMap } from '@/classes/LinearColorMap'

interface Props {
  colorMap: LinearColorMap
}

const props = defineProps<Props>()

// Compute the CSS gradient string based on the color map
const gradientStyle = computed(() => {
  const minColor = `#${props.colorMap.minColor.toString(16).padStart(6, '0')}`
  const maxColor = `#${props.colorMap.maxColor.toString(16).padStart(6, '0')}`
  return `linear-gradient(to right, ${minColor}, ${maxColor})`
})

const handleMinColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.colorMap.setMinColor(parseInt(target.value.replace('#', ''), 16))
}

const handleMaxColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.colorMap.setMaxColor(parseInt(target.value.replace('#', ''), 16))
}

const handleColorZeroChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.colorMap.setColorZero(parseInt(target.value.replace('#', ''), 16))
}
</script>

<template>
  <div class="dropdown w-full p-2 -translate-y-2 custom-shadow">
    <!-- NOTE: use this to disable the box-shadow around the color legend -->
    <!-- <div class="dropdown w-full"> -->
    <!-- Button to toggle the dropdown -->
    <div tabindex="0" class="w-full cursor-pointer" role="button">
      <div class="w-full h-4" :style="{ background: gradientStyle }"></div>
      <div class="w-full flex justify-between text-xs mt-1">
        <span>{{ props.colorMap.min }}</span>
        <span>{{ props.colorMap.max }}</span>
      </div>
    </div>

    <!-- Dropdown content -->
    <div
      tabindex="0"
      class="dropdown-content bg-base-100 rounded-sm z-[1] w-full border p-2 shadow text-sm"
    >
      <!-- Minimum settings -->
      <div class="flex gap-2 items-center justify-between mb-2">
        <p class="w-min">Minimum:</p>
        <input
          type="number"
          class="input input-bordered input-xs w-16"
          :value="props.colorMap.min"
          :max="props.colorMap.max - 1"
          @input="
            (payload: Event) =>
              props.colorMap.setMin(Number((payload.target as HTMLInputElement).value))
          "
        />
        <input
          type="color"
          id="minColor"
          class="w-8 h-[1rem]"
          name="minColor"
          :value="`#${props.colorMap.minColor.toString(16).padStart(6, '0')}`"
          @input="handleMinColorChange"
        />
      </div>

      <!-- Maximum settings -->
      <div class="flex gap-2 items-center justify-between mb-2">
        <p class="w-min">Maximum:</p>
        <input
          type="number"
          class="input input-bordered input-xs w-16"
          :value="props.colorMap.max"
          :min="props.colorMap.min + 1"
          @input="
            (payload: Event) =>
              props.colorMap.setMax(Number((payload.target as HTMLInputElement).value))
          "
        />
        <input
          type="color"
          id="maxColor"
          class="w-8 h-[1rem]"
          name="maxColor"
          :value="`#${props.colorMap.maxColor.toString(16).padStart(6, '0')}`"
          @input="handleMaxColorChange"
        />
      </div>

      <!-- Zero special settings -->
      <div class="flex gap-2 justify-between items-center">
        <p class="">Treat Zero special?</p>
        <input
          type="checkbox"
          :checked="props.colorMap.isZeroSpecial"
          @change="() => props.colorMap.setIsZeroSpecial(!props.colorMap.isZeroSpecial)"
          class="checkbox checkbox-xs"
        />
        <input
          type="color"
          id="colorZero"
          class="w-8 h-[1rem]"
          name="colorZero"
          :value="`#${props.colorMap.colorZero.toString(16).padStart(6, '0')}`"
          @input="handleColorZeroChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom-shadow {
  box-shadow: 0px 0px 3px 1px rgba(0, 0, 0, 0.5);
}
</style>
