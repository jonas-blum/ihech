<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { Icon } from '@iconify/vue'
import { AggregationMethodEnum, mapAggregationMethodEnum, mapScalingEnum, ScalingEnum } from '@/helpers/helpers'

const mainStore = useMainStore()
const heatmapLayoutStore = useHeatmapLayoutStore()



</script>

<template>
    <div class="dropdown dropdown-hover items-start align-start text-xs">
        <div tabindex="0" role="button" class="p-2 rounded-sm flex gap-2 justify-center">
            <span>Data Processing</span>
            <Icon icon="fluent-mdl2:processing" class="p-0 w-4 h-4 text-opacity-50 cursor-pointer" />
        </div>
        <div tabindex="0"
            class="dropdown-content bg-base-100 z-[1] w-48 p-2 rounded-sm custom-shadow text-xs flex flex-col gap-2">
            <div>
                <p class="font-bold mb-1">Value Scaling Mode:</p>
                <select class="select select-bordered select-xs w-min cursor-pointer"
                    :value="mainStore.activeDataTable?.scaling"
                    @change="(e: Event) => mainStore.setScaling((e.target as HTMLSelectElement).value as ScalingEnum)">
                    <option v-for="scalingMode in Object.values(ScalingEnum)" :key="scalingMode" :value="scalingMode"
                        class="cursor-pointer">
                        {{ mapScalingEnum(scalingMode) }}
                    </option>
                </select>
            </div>
            <div>
                <p class="font-bold mb-1">Item Aggregation Method:</p>
                <select class="select select-bordered select-xs w-min cursor-pointer"
                    :value="mainStore.activeDataTable?.itemAggregateMethod"
                    @change="(e: Event) => mainStore.setItemAggregateMethod((e.target as HTMLSelectElement).value as ScalingEnum)">
                    <option v-for="aggregateMethod in Object.values(AggregationMethodEnum)" :key="aggregateMethod"
                        :value="aggregateMethod" class="cursor-pointer">
                        {{ mapAggregationMethodEnum(aggregateMethod) }}
                    </option>
                </select>
            </div>
            <div>
                <p class="font-bold mb-1">Attribute Aggregation Method:</p>
                <select class="select select-bordered select-xs w-min cursor-pointer"
                    :value="mainStore.activeDataTable?.attributeAggregateMethod"
                    @change="(e: Event) => mainStore.setAttributeAggregateMethod((e.target as HTMLSelectElement).value as ScalingEnum)">
                    <option v-for="aggregateMethod in Object.values(AggregationMethodEnum)" :key="aggregateMethod"
                        :value="aggregateMethod" class="cursor-pointer">
                        {{ mapAggregationMethodEnum(aggregateMethod) }}
                    </option>
                </select>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
