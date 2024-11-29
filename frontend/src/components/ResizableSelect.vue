<script setup lang="ts">
import { defineProps, ref, watch, onMounted, nextTick } from 'vue'

type Option = {
  value: string
  label: string
}

const props = defineProps<{
  options: Array<Option>
  selected: string
  callback: (event: Event) => void
  selectClasses?: string
  placeholder?: string
}>()

// Reference to the select element
const selectRef = ref<HTMLSelectElement | null>(null)
// Reference to a hidden span used for measuring text width
const hiddenSpanRef = ref<HTMLSpanElement | null>(null)

// Function to update the width of the select element
const updateSelectWidth = () => {
  if (selectRef.value && hiddenSpanRef.value) {
    // Find the selected option
    const selectedOption = props.options.find((option) => option.value === props.selected)
    if (selectedOption) {
      // Set the text of the hidden span to the selected option's label
      hiddenSpanRef.value.innerText = selectedOption.label
      // Get the width of the hidden span
      const spanWidth = hiddenSpanRef.value.offsetWidth
      // Set the select's width, adding extra space for padding and arrow
      selectRef.value.style.width = `${spanWidth + 50}px`
    } else {
      if (props.placeholder) {
        hiddenSpanRef.value.innerText = props.placeholder
        const spanWidth = hiddenSpanRef.value.offsetWidth
        selectRef.value.style.width = `${spanWidth + 50}px`
      }
    }
  }
}

// Watch for changes to the selected prop and update width
watch(
  () => props.selected,
  () => {
    nextTick(() => {
      updateSelectWidth()
    })
  },
)

// Update the width when the component is mounted
onMounted(() => {
  updateSelectWidth()
})
</script>

<template>
  <div class="relative">
    <select
      ref="selectRef"
      @change="callback"
      :class="['select select-bordered w-min', selectClasses]"
    >
      <option v-if="placeholder" value="" disabled selected hidden>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :selected="selected === option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <!-- Hidden span to measure the width of the selected option -->
    <span
      ref="hiddenSpanRef"
      class="text-xs"
      style="
        visibility: hidden;
        white-space: nowrap;
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        padding: 0;
        margin: 0;
      "
    ></span>
  </div>
</template>
