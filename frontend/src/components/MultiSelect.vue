<script setup lang="ts">
import { defineProps, ref, computed, watch, onMounted, nextTick } from 'vue'
import type { IndexLabelInterface } from '@/helpers/helpers'
import ResizableSelect from '@/components/ResizableSelect.vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  options: Array<IndexLabelInterface>
}>()

// computed value for the selected options
const selectedOptions = computed(() => props.options.filter((item) => item.selected))

// computed value for unselected options
const unselectedOptions = computed(() => props.options.filter((item) => !item.selected))

// to make it compatible with the ResizableSelect component
const unselectedOptionsAsOptions = computed(() =>
  unselectedOptions.value.map((item) => {
    return {
      label: item.label,
      value: item.index.toString(),
    }
  }),
)

const refreshWorkaround = ref(true)

const unselectOption = (option: IndexLabelInterface) => {
  option.selected = false
}

const optionSelectCallback = (event: Event) => {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  console.log('event.target.value:', event.target.value)
  const index = parseInt(event.target.value, 10)
  props.options[index].selected = true

  // workaround to force the ResizableSelect component to re-render
  refreshWorkaround.value = false
  setTimeout(() => {
    refreshWorkaround.value = true
  }, 1)
}
</script>

<template>
  <div class="text-sm inline-block m-0 pl-1">
    <div class="flex gap-2">
      <div v-for="option in selectedOptions" :key="option.index" class="px-1 bg-base-200 rounded-md">
        <span>{{ option.label }}</span>
        <!-- <button @click="unselectOption(option)" class="btn btn-xs">x</button> -->
        <button
          class="p-0 pl-1"
          @click="unselectOption(option)"
        >
          <Icon icon="line-md:remove" class="w-[0.75rem] h-[0.75rem] p-0 text-opacity-50 cursor-pointer" />
        </button>
      </div>
      <ResizableSelect
        v-if="unselectedOptionsAsOptions.length > 0 && refreshWorkaround"
        class="inline-block"
        :options="unselectedOptionsAsOptions"
        selected=""
        :callback="optionSelectCallback"
        selectClasses="select select-xs"
        placeholder="Add"
      ></ResizableSelect>
    </div>
  </div>
</template>
