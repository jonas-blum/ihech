<script setup lang="ts">
import { defineProps, computed, ref } from 'vue'
import { LinearColorMap } from '@/classes/LinearColorMap'

interface Props {
  colorMap: LinearColorMap
}

const props = defineProps<Props>()

const settingsOpen = ref(false)

const toggleSettings = () => {
  settingsOpen.value = !settingsOpen.value
}

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
  <div>
    <div class="relative w-full">
      <!-- <p class="text-sm font-bold">Color Map:</p> -->
      <div class="w-full py-2 cursor-pointer" @click="toggleSettings">
        <div class="w-full h-4" :style="{ background: gradientStyle }"></div>
        <div class="w-full flex justify-between text-xs">
          <span>{{ props.colorMap.min }}</span>
          <span>{{ props.colorMap.max }}</span>
        </div>
      </div>
      <div v-if="settingsOpen" class="absolute top-[100%] z-10 w-full border-2 bg-white">
        <div class="flex flex-col justify-between text-sm">
          <div class="flex gap-2">
            <p class="w-min">Minimum</p>
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
              class="w-8"
              name="minColor"
              :value="`#${props.colorMap.minColor.toString(16).padStart(6, '0')}`"
              @input="handleMinColorChange"
            />
          </div>
          <div class="flex gap-2">
            <p class="w-min">Maximum</p>
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
              class="w-8"
              name="maxColor"
              :value="`#${props.colorMap.maxColor.toString(16).padStart(6, '0')}`"
              @input="handleMaxColorChange"
            />
          </div>
          <div class="flex gap-2 items-center">
            <p class="">Treat Zero special</p>
            <input
              type="checkbox"
              :checked="props.colorMap.isZeroSpecial"
              @change="() => props.colorMap.setIsZeroSpecial(!props.colorMap.isZeroSpecial)"
              class="checkbox checkbox-xs"
            />
            <input
              type="color"
              id="colorZero"
              class="w-8"
              name="colorZero"
              :value="`#${props.colorMap.colorZero.toString(16).padStart(6, '0')}`"
              @input="handleColorZeroChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
