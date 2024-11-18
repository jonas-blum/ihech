<script setup lang="ts">
import { useHeatmapStore } from '@stores/heatmapStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'
import { Icon } from '@iconify/vue'

const itemGroupingOptions = [
  { label: 'No Grouping', value: 'none' },
  { label: 'Kanton', value: 'kanton' },
  { label: 'District', value: 'district' },
  { label: 'Language Region', value: 'language' },
]

const attributeGroupingOptions = [
  { label: 'Age Group', value: 'age' },
  { label: '???', value: '???' },
]

const kOptions = [
  { label: 'k=2', value: 2 },
  { label: 'k=3', value: 3 },
  { label: 'k=4', value: 4 },
  { label: 'k=5', value: 5 },
  { label: 'k=6', value: 6 },
  { label: 'k=7', value: 7 },
  { label: 'k=8', value: 8 },
  { label: 'k=9', value: 9 },
  { label: 'k=10', value: 10 },
]
</script>

<template>
  <div class="text-md">
    <p>You are exploring the age distribution of residents across municipalities in Switzerland.</p>
    <p>
      Municipalities are grouped by
      <select class="select select-bordered select-xs w-min mx-1">
        <option v-for="option in itemGroupingOptions" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      and recursively clustered using the k-means algorithm with
      <select class="select select-bordered select-xs w-min mx-1">
        <option v-for="option in kOptions" :value="option.value">{{ option.label }}</option>
      </select>
      on the 
      <select class="select select-bordered select-xs w-min mx-1">
        <option value="hd">high-dimensional</option>
        <option value="ld">dimensionality reduced</option>
      </select>
      data.
    </p>
    <p>
      Age groups are grouped by
      <select class="select select-bordered select-xs w-min mx-1">
        <option v-for="option in attributeGroupingOptions" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      .
    </p>
  </div>
</template>
