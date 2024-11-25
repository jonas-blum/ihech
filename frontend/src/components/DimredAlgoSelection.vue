<script setup lang="ts">
import { DimReductionAlgoEnum, mapDimReductionAlgoEnum } from '@/helpers/helpers'
import { ref, computed, watch } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { Icon } from '@iconify/vue'

const mainStore = useMainStore()
const heatmapLayoutStore = useHeatmapLayoutStore()

// Get the first algorithm from the enum as the default
const firstDimReductionAlgo = Object.values(DimReductionAlgoEnum)[0]

// The selected algorithm, which will be bound to the select
const selectedDimReductionAlgo = ref<DimReductionAlgoEnum>(firstDimReductionAlgo)

async function updateDimReductionAlgo(dimReductionAlgo: DimReductionAlgoEnum) {
    console.log('updateDimReductionAlgo', dimReductionAlgo)
  mainStore.setDimReductionAlgo(dimReductionAlgo)
  mainStore.setIsOutOfSync(true)
}
</script>

<template>
  <div class="w-full max-w-xs p-2">
    <select
      class="select select-bordered select-sm w-min cursor-pointer"
      v-model="selectedDimReductionAlgo"
      @change="() => updateDimReductionAlgo(selectedDimReductionAlgo)"
    >
      <!-- <option disabled selected>Select Dimensionality Reduction Algorithm</option> -->
      <option
        v-for="dimReductionAlgo in Object.values(DimReductionAlgoEnum)"
        :key="dimReductionAlgo"
        :value="dimReductionAlgo"
        class="cursor-pointer"
      >
        {{ mapDimReductionAlgoEnum(dimReductionAlgo) }}
      </option>
    </select>
  </div>
</template>

<style scoped lang="scss"></style>
