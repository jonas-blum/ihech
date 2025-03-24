<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'

import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'

const heatmapLayoutStore = useHeatmapLayoutStore()

const emit = defineEmits<(e: 'zoomchanged', zoom: number) => void>()

const options = [
    {
        label: '5',
        value: 5,
    },
    {
        label: '10',
        value: 10,
    },
    {
        label: '15',
        value: 15,
    },
    {
        label: '20',
        value: 20,
    },
]

const selectedOption = ref<number | null>(null)

const handleSelection = (value: number) => {
    selectedOption.value = value
    emit('zoomchanged', value)
}

const zoomOut = () => {
    if (selectedOption.value !== null) {
        const currentIndex = options.findIndex(option => option.value === selectedOption.value)
        if (currentIndex > 0) {
            selectedOption.value = options[currentIndex - 1].value
            emit('zoomchanged', selectedOption.value)
        }
    }
}

const zoomIn = () => {
    if (selectedOption.value !== null) {
        const currentIndex = options.findIndex(option => option.value === selectedOption.value)
        if (currentIndex < options.length - 1) {
            selectedOption.value = options[currentIndex + 1].value
            emit('zoomchanged', selectedOption.value)
        }
    }
}

onMounted(() => {
    selectedOption.value = heatmapLayoutStore.rowHeight
})

</script>

<template>
    <div class="bg-white flex items-center">
        <button @click="zoomOut" class="btn btn-xs bg-white rounded-none p-0.5">
            <Icon icon="ic:baseline-minus" class="p-0 w-4 h-4 text-opacity-50 cursor-pointer" />
            <!-- <span class="text-xs font-normal">Zoom In</span> -->
        </button>
        <div v-for="option in options" :key="option.value">
            <input type="radio" name="zoom-radio" class="radio radio-xs radio-neutral"
                :checked="selectedOption === option.value" :value="option.value"
                @change="handleSelection(option.value)">
            <!-- <span class="text-xs">
                {{ option.label }}
            </span> -->
            </input>
        </div>
        <button @click="zoomIn" class="btn btn-xs bg-white rounded-none p-0.5">
            <Icon icon="ic:baseline-plus" class="p-0 w-4 h-4 text-opacity-50 cursor-pointer" />
            <!-- <span class="text-xs font-normal">Zoom Out</span> -->
        </button>
        <!-- <div v-if="selectedOption !== null">
            Selected: {{ selectedOption }}
        </div> -->
    </div>
</template>

<style scoped></style>
