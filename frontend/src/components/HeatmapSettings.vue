<script setup lang="ts">
import {
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  ColoringHeatmapEnum,
} from '@/helpers/helpers'

import type { ItemNameAndData } from '@/helpers/helpers'
import { getHeatmapColor } from '@/helpers/helpers'
import { useHeatmapStore } from '@/stores/heatmapStore'
import SettingsIcon from '@assets/settings.svg'

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

async function updateScaling(scaling: ScalingEnum) {
  heatmapStore.setScaling(scaling)
  heatmapStore.setIsOutOfSync(true)
}

function updateColoringHeatmap(coloringHeatmap: ColoringHeatmapEnum) {
  heatmapStore.setColoringHeatmap(coloringHeatmap)
}

async function updateClusterByCollections(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterByCollections(event.target.checked)
  heatmapStore.setIsOutOfSync(true)
}

async function updateSortOrderAttributes(sortOrder: SortOrderAttributes) {
  heatmapStore.setSortOrderAttributes(sortOrder)
  heatmapStore.setIsOutOfSync(true)
}

async function updateSortAttributesBasedOnStickyItems(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setSortAttributesBasedOnStickyItems(event.target.checked)
  heatmapStore.setIsOutOfSync(true)
}

async function updateClusterBasedOnStickyAttributes(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterItemsBasedOnStickyAttributes(event.target.checked)
  heatmapStore.setIsOutOfSync(true)
}

async function updateClusterAfterDimRed(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterAfterDimRed(event.target.checked)
  heatmapStore.setIsOutOfSync(true)
}

async function updateClusterSize(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const size = event.target.value
  heatmapStore.setClusterSize(parseInt(size, 10))
  heatmapStore.setIsOutOfSync(true)
}

async function updateDimReductionAlgo(dimReductionAlgo: DimReductionAlgoEnum) {
  heatmapStore.setDimReductionAlgo(dimReductionAlgo)
  heatmapStore.setIsOutOfSync(true)
}

function updateOnlyDimReductionBasedOnStickyItems(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.toggleShowOnlyStickyItemsInDimReduction(event.target.checked)
  heatmapStore.changeHeatmap()
}

function reloadHeatmap() {
  heatmapStore.setCsvUploadOpen(false)
  heatmapStore.fetchHeatmap()
}

function getMiddleColorScaleValue() {
  if (heatmapStore.isColorScaleNotShown) {
    return 0
  }
  if (heatmapStore.activeDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC) {
    return (
      Math.sqrt(
        (heatmapStore.getHeatmapMinValue + heatmapStore.getLogShiftValue) *
          (heatmapStore.getHeatmapMaxValue + heatmapStore.getLogShiftValue),
      ) - heatmapStore.getLogShiftValue
    )
  }
  return (heatmapStore.getHeatmapMinValue + heatmapStore.getHeatmapMaxValue) / 2
}
</script>

<template>
  <div class="settings-container">
    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <SettingsIcon style="height: 20px; width: 20px" />
        <p>Dim Reduction</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <a>
            <div class="toggle-container" style="align-self: center">
              <p>Only sticky items?</p>
              <input
                @click="updateOnlyDimReductionBasedOnStickyItems($event)"
                type="checkbox"
                class="toggle"
                :checked="heatmapStore.getActiveDataTable?.showOnlyStickyItemsInDimReduction"
              />
            </div>
          </a>
        </li>
        <li>
          <a>
            Algorithm:
            <ul class="menu menu-vertical bg-base-200">
              <li
                :key="dimReductionAlgo"
                :style="{ border: 'none' }"
                v-for="dimReductionAlgo in Object.values(DimReductionAlgoEnum)"
              >
                <a
                  @click="updateDimReductionAlgo(dimReductionAlgo)"
                  :class="{
                    'bg-green-700 text-white':
                      heatmapStore.getActiveDataTable?.dimReductionAlgo === dimReductionAlgo,
                  }"
                  >{{ dimReductionAlgo }}</a
                >
              </li>
            </ul>
          </a>
        </li>
      </ul>
    </div>
    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" class="btn m-1">
        <SettingsIcon style="height: 20px; width: 20px" />
        <p>Clustering</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <a>
            Size:
            <select @change="updateClusterSize($event)" class="select select-primary max-w-xs">
              <option
                :key="i"
                :selected="heatmapStore.getActiveDataTable?.clusterSize === i"
                v-for="i in Array.from({ length: 29 }, (_, i) => i + 2)"
              >
                {{ i }}
              </option>
            </select>
          </a>
        </li>
        <li>
          <a>
            <div class="toggle-container">
              <p>By Collections?</p>
              <input
                @click="updateClusterByCollections"
                type="checkbox"
                class="toggle"
                :checked="heatmapStore.getActiveDataTable?.clusterByCollections"
              />
            </div>
          </a>
        </li>
        <li>
          <a>
            <div class="toggle-container">
              <p>After Dim Red?</p>
              <input
                @click="updateClusterAfterDimRed($event)"
                type="checkbox"
                class="toggle"
                :checked="heatmapStore.getActiveDataTable?.clusterAfterDimRed"
              />
            </div>
          </a>
        </li>
        <li>
          <a>
            <div class="toggle-container">
              <p>Based on sticky Attributes?</p>
              <input
                @click="updateClusterBasedOnStickyAttributes($event)"
                type="checkbox"
                class="toggle"
                :checked="heatmapStore.getActiveDataTable?.clusterItemsBasedOnStickyAttributes"
              />
            </div>
          </a>
        </li>

        <li>
          <a>
            Scaling:
            <ul class="menu menu-vertical bg-base-200">
              <li
                :key="scaling"
                :style="{ border: 'none' }"
                v-for="scaling in Object.values(ScalingEnum)"
              >
                <a
                  @click="updateScaling(scaling)"
                  :class="{
                    'bg-green-700 text-white': heatmapStore.getActiveDataTable?.scaling === scaling,
                  }"
                  >{{ scaling }}</a
                >
              </li>
            </ul>
          </a>
        </li>

        <li>
          <a>
            Color weights:
            <ul class="menu menu-vertical bg-base-200">
              <li
                :key="coloringHeatmap"
                :style="{ border: 'none' }"
                v-for="coloringHeatmap in Object.values(ColoringHeatmapEnum)"
              >
                <a
                  @click="updateColoringHeatmap(coloringHeatmap)"
                  :class="{
                    'bg-green-700 text-white':
                      heatmapStore.getActiveDataTable?.coloringHeatmap === coloringHeatmap,
                  }"
                  >{{ coloringHeatmap }}</a
                >
              </li>
            </ul>
          </a>
        </li>
      </ul>
    </div>

    <div style="z-index: 99999" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <SettingsIcon style="height: 20px; width: 20px" />
        <p>Attributes</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <a>
            <div class="toggle-container">
              <p>Sort based on sticky items?</p>
              <input
                @click="updateSortAttributesBasedOnStickyItems"
                type="checkbox"
                class="toggle"
                :checked="heatmapStore.getActiveDataTable?.sortAttributesBasedOnStickyItems"
              />
            </div>
          </a>
        </li>
        <li>
          <a>
            Order:
            <ul class="menu menu-vertical bg-base-200">
              <li
                :key="sortOrder"
                :style="{ border: 'none' }"
                v-for="sortOrder in Object.values(SortOrderAttributes)"
              >
                <a
                  @click="updateSortOrderAttributes(sortOrder)"
                  :class="{
                    'bg-green-700 text-white':
                      heatmapStore.getActiveDataTable?.sortOrderAttributes === sortOrder,
                  }"
                  >{{ sortOrder }}</a
                >
              </li>
            </ul>
          </a>
        </li>
      </ul>
    </div>

    <div v-if="!heatmapStore.isColorScaleNotShown" id="color-scale-container">
      <div class="color-scale-labels">
        <span class="min-label">{{ parseFloat(heatmapStore.getHeatmapMinValue.toFixed(3)) }}</span>
        <span class="middle-label">{{ parseFloat(getMiddleColorScaleValue().toFixed(3)) }}</span>
        <span class="max-label">{{ parseFloat(heatmapStore.getHeatmapMaxValue.toFixed(3)) }}</span>
      </div>
      <div
        :style="{
          background:
            'linear-gradient(to right, ' +
            getHeatmapColor(0, 0, 1) +
            ', ' +
            getHeatmapColor(1, 0, 1) +
            ')',
        }"
        class="color-scale"
      >
        <div class="middle-marker"></div>
      </div>
    </div>

    <button
      @click="reloadHeatmap()"
      :style="{ marginLeft: '30px' }"
      :class="{
        btn: true,
        'btn-success': !heatmapStore.isOutOfSync,
        'btn-warning': heatmapStore.isOutOfSync,
        'text-lg': true,
      }"
    >
      Reload Heatmap
      <span v-if="heatmapStore.isOutOfSync">(unsaved changes!)</span>
      <span v-if="heatmapStore.isLoading" class="loading loading-spinner"></span>
    </button>
  </div>
</template>

<style scoped>
.settings-container {
  width: 100%;
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
  width: 180px;
  position: relative;
  padding-left: 1px;
  padding-right: 1px;
}

.color-scale {
  width: 100%;
  height: 20px;
  background: linear-gradient(to right, #f00, #ff0, #0f0);
  margin-top: 10px;
}

.color-scale:before,
.color-scale:after,
.color-scale .middle-marker {
  content: '';
  position: absolute;
  top: 20px;
  width: 3px;
  height: 15px;
  background-color: #000;
}

.color-scale:before {
  left: 1%;
}

.color-scale:after {
  left: 99%;
  transform: translateX(-100%);
}

.color-scale .middle-marker {
  left: 50%;
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
  width: 60px;
  text-align: center;
}

.color-scale-labels span:first-child {
  text-align: start;
}

.color-scale-labels span:last-child {
  text-align: end;
}
</style>
