<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { type HierarchicalItem } from '@/helpers/helpers'

const props = withDefaults(
  defineProps<{
    options: HierarchicalItem[]
    selected: HierarchicalItem | null
  }>(),
  {},
)

const emit = defineEmits<(e: 'select', option: HierarchicalItem | null) => void>()

const singleSelectRef = ref<HTMLElement | null>(null)

const inputModel = ref('')
const dropdownOpen = ref(false)

watch(inputModel, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    dropdownOpen.value = true
  }
})

const filteredOptions = computed(() => {
  return props.options.filter((option) =>
    option.itemName.toLowerCase().includes(inputModel.value.toLowerCase()),
  )
})

const selectOption = (option: HierarchicalItem) => {
  inputModel.value = option.itemName
  emit('select', option)
  nextTick(() => {
    dropdownOpen.value = false
  })
}

const handleFocus = () => {
  inputModel.value = ''
  emit('select', null)
  dropdownOpen.value = true
}

function hasUserClickedOutside(event: MouseEvent, element: HTMLElement | null): boolean {
  if (element && event.target instanceof Node && !element.contains(event.target)) {
    return true
  }
  return false
}

function closeOnOutsideClick(event: MouseEvent): void {
  const el = singleSelectRef.value
  if (hasUserClickedOutside(event, el)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  if (!singleSelectRef.value) {
    return
  }

  document.addEventListener('click', closeOnOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnOutsideClick)
})
</script>

<template>
  <div ref="singleSelectRef" class="dropdown-container">
    <input
      type="text"
      v-model="inputModel"
      @focus="handleFocus"
      placeholder="Search Item..."
      class="dropdown-input"
    />
    <ul v-if="dropdownOpen" class="dropdown-list">
      <li
        v-for="(option, key) in filteredOptions.slice(0, 5000)"
        :key="key"
        @click="selectOption(option)"
      >
        {{ option.itemName }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-container {
  position: relative;
  width: 100%;
  z-index: 1000000;
}

.dropdown-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.dropdown-list {
  position: absolute;
  width: 100%;
  min-height: 20px;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.dropdown-list li {
  padding: 8px;
  cursor: pointer;
}

.dropdown-list li:hover {
  background-color: #f0f0f0;
}
</style>
