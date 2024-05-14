<script setup lang="ts">
import type { ItemNameAndData } from '@/helpers/helpers'
import { getHeatmapColor } from '@/helpers/helpers'
import {
  StructuralFeatureEnum,
  AbsRelLogEnum,
  MedianMaxMinEnum,
  SortOrderAttributes,
  DimReductionAlgoEnum,
  useHeatmapStore
} from '@stores/heatmapStore'

const heatmapStore = useHeatmapStore()

function findRowRecursively(row: ItemNameAndData, rowName: string): ItemNameAndData | undefined {
  if (row.itemName === rowName) {
    return row
  }
  if (row.children) {
    for (const child of row.children) {
      const foundRow = findRowRecursively(child, rowName)
      if (foundRow) {
        return foundRow
      }
    }
  }
}

function findRowAndOpenIt(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  let foundRow: ItemNameAndData | undefined = undefined
  for (const row of heatmapStore.getHeatmap.itemNamesAndData) {
    foundRow = findRowRecursively(row, event.target.value)
    if (foundRow) {
      break
    }
  }

  if (foundRow) {
    let parent = foundRow.parent
    while (parent) {
      heatmapStore.expandRow(parent)
      parent = parent.parent
    }
    heatmapStore.setHighlightedRow(foundRow)
    heatmapStore.changeHeatmap()
  } else {
    console.error('Row not found:', event.target.value)
  }
}

async function updateStructuralFeature(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const selectedFeature = event.target.value
  heatmapStore.setStructuralFeature(selectedFeature as StructuralFeatureEnum)
  await heatmapStore.fetchHeatmap()
}

async function updateAbsRel(selectedAbsRel: AbsRelLogEnum) {
  heatmapStore.setAbsRel(selectedAbsRel)
  await heatmapStore.fetchHeatmap()
}

async function updateMedianMaxMin(selectedMedianMaxMin: MedianMaxMinEnum) {
  if (heatmapStore.isMedianMaxMinDisabled) {
    return
  }
  heatmapStore.setMedianMaxMin(selectedMedianMaxMin)
  await heatmapStore.fetchHeatmap()
}

async function updateClusterByEditions(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterByEditions(event.target.checked)
  await heatmapStore.fetchHeatmap()
}

async function updateSortOrderColumns(sortOrder: SortOrderAttributes) {
  heatmapStore.setSortOrderColumns(sortOrder)
  await heatmapStore.fetchHeatmap()
}

async function updateSortOrderBasedOnStickyItems(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setSortColumnsBasedOnStickyItems(event.target.checked)
  await heatmapStore.fetchHeatmap()
}

async function updateClusterBasedOnStickyAttributes(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterItemsBasedOnStickyAttributes(event.target.checked)
  await heatmapStore.fetchHeatmap()
}

async function updateClusterAfterDimRed(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setIsClusterAfterDimRed(event.target.checked)
  await heatmapStore.fetchHeatmap()
}

async function updateClusterSize(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const size = event.target.value
  heatmapStore.setClusterSize(parseInt(size, 10))
  await heatmapStore.fetchHeatmap()
}

async function updateDimReductionAlgo(dimReductionAlgo: DimReductionAlgoEnum) {
  heatmapStore.setDimReductionAlgo(dimReductionAlgo)
  await heatmapStore.fetchHeatmap()
}

function updateOnlyDimReductionBasedOnStickyItems(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.toggleShowOnlyStickyItemsInDimReduction(event.target.checked)
  heatmapStore.changeHeatmap()
}
</script>

<template>
  <div class="settings-container">
    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <img style="height: 20px; width: 20px" src="@assets/settings.svg" />
        <p>Dim Reduction</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <div class="toggle-container" style="align-self: center">
            <p>Only sticky items?</p>
            <input
              @click="updateOnlyDimReductionBasedOnStickyItems($event)"
              type="checkbox"
              class="toggle"
              :checked="heatmapStore.isOnlyStickyItemsShownInDimReduction"
            />
          </div>
        </li>
        <li>
          <div>
            <p>Algorithm:</p>
            <ul class="menu menu-vertical bg-base-200">
              <li
                :key="dimReductionAlgo"
                style="border: none"
                v-for="dimReductionAlgo in Object.values(DimReductionAlgoEnum)"
              >
                <a
                  @click="updateDimReductionAlgo(dimReductionAlgo)"
                  :class="{
                    'bg-green-700 text-white': heatmapStore.getDimReductionAlgo === dimReductionAlgo
                  }"
                  >{{ dimReductionAlgo }}</a
                >
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <img style="height: 20px; width: 20px" src="@assets/settings.svg" />
        <p>Clustering</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <div class="size-container">
            <p>Size:</p>
            <select @change="updateClusterSize($event)" class="select select-primary max-w-xs">
              <option
                :key="i"
                :selected="heatmapStore.getClusterSize === i"
                v-for="i in Array.from({ length: 29 }, (_, i) => i + 2)"
              >
                {{ i }}
              </option>
            </select>
          </div>
        </li>
        <li>
          <div class="toggle-container">
            <p>By editions?</p>
            <input
              @click="updateClusterByEditions"
              type="checkbox"
              class="toggle"
              :checked="heatmapStore.isClusteredByEditions"
            />
          </div>
        </li>
        <li>
          <div class="toggle-container">
            <p>After Dim Red?</p>
            <input
              @click="updateClusterAfterDimRed($event)"
              type="checkbox"
              class="toggle"
              :checked="heatmapStore.isClusterAfterDimRed"
            />
          </div>
        </li>
        <li>
          <div class="toggle-container">
            <p>Based on sticky Attributes?</p>
            <input
              @click="updateClusterBasedOnStickyAttributes($event)"
              type="checkbox"
              class="toggle"
              :checked="heatmapStore.isClusterItemsBasedOnStickyAttributes"
            />
          </div>
        </li>
      </ul>
    </div>

    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <img style="height: 20px; width: 20px" src="@assets/settings.svg" />
        <p>Columns</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <div class="toggle-container">
            <p>Sort based on sticky items?</p>
            <input
              @click="updateSortOrderBasedOnStickyItems"
              type="checkbox"
              class="toggle"
              :checked="heatmapStore.isSortColumnsBasedOnStickyItems"
            />
          </div>
        </li>
        <li>
          <div>
            <p>Order:</p>
            <ul class="menu menu-vertical bg-base-200">
              <li
                :key="sortOrder"
                style="border: none"
                v-for="sortOrder in Object.values(SortOrderAttributes)"
              >
                <a
                  @click="updateSortOrderColumns(sortOrder)"
                  :class="{
                    'bg-green-700 text-white': heatmapStore.getSortOrderColumns === sortOrder
                  }"
                  >{{ sortOrder }}</a
                >
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>

    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <img style="height: 20px; width: 20px" src="@assets/settings.svg" />
        <p>Tag Metrics</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <ul class="menu menu-vertical bg-base-200">
            <li :key="absRel" style="border: none" v-for="absRel in Object.values(AbsRelLogEnum)">
              <a
                @click="updateAbsRel(absRel)"
                :class="{
                  'bg-green-700 text-white': heatmapStore.getSelectedAbsRel === absRel
                }"
                >{{ absRel }}</a
              >
            </li>
          </ul>
        </li>
        <li>
          <ul class="menu menu-vertical bg-base-200">
            <li
              :key="medianMaxMin"
              style="border: none"
              :class="{ disabled: heatmapStore.isMedianMaxMinDisabled }"
              v-for="medianMaxMin in Object.values(MedianMaxMinEnum)"
            >
              <a
                @click="updateMedianMaxMin(medianMaxMin)"
                :class="{
                  'bg-green-700 text-white': heatmapStore.getSelectedMedianMaxMin === medianMaxMin
                }"
                >{{ medianMaxMin }}</a
              >
            </li>
          </ul>
        </li>
        <li>
          <select @change="updateStructuralFeature($event)" class="select select-primary max-w-xs">
            <option
              :key="structuralFeature"
              :selected="heatmapStore.getSelectedFeature === structuralFeature"
              v-for="structuralFeature in Object.values(StructuralFeatureEnum)"
            >
              {{ structuralFeature }}
            </option>
          </select>
        </li>
      </ul>
    </div>

    <div id="color-scale-container">
      <div class="color-scale-labels">
        <span class="min-label">{{ heatmapStore.getHeatmapMinValue }}</span>
        <span class="max-label">{{ heatmapStore.getHeatmapMaxValue }}</span>
      </div>
      <div
        :style="{
          background:
            'linear-gradient(to right, ' +
            getHeatmapColor(0, 0, 1) +
            ', ' +
            getHeatmapColor(1, 0, 1) +
            ')'
        }"
        class="color-scale"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  width: 100%;
  margin-bottom: 30px;
  margin-top: 10px;
  display: flex;
  gap: 10px;

  li:not(:last-child) {
    border-bottom: 1px solid black;
  }

  .cluster-size-container {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .size-container {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .feature-settings-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .column-order-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}

.toggle-container {
  display: flex;
  gap: 5px;
  align-items: center;
}

.toggle-container-bold {
  font-weight: bold;
}

#color-scale-container {
  width: 150px;
  position: relative;
}

.color-scale {
  width: 100%;
  height: 20px;
  background: linear-gradient(to right, #f00, #ff0, #0f0);
  margin-top: 10px;
}

.color-scale-labels {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.color-scale-labels span {
  position: relative;
  font-size: 15px;
  font-weight: bold;
}
</style>
