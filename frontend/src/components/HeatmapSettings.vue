<script setup lang="ts">
import {
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  ColoringHeatmapEnum,
  mapDimReductionAlgoEnum,
  mapColoringHeatmapEnum,
  mapSortOderAttributesEnum,
  mapScalingEnum,
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
    <div style="z-index: 99999999" class="dropdown dropdown-bottom">
      <div class="self-tooltip">
        <span class="tooltiptext"
          >Here are the settings regarding the Dimensionality Reduction visual on the left
          side</span
        >
        <div tabindex="0" role="button" class="btn m-1">
          <SettingsIcon style="height: 20px; width: 20px" />
          <p>Dim Reduction</p>
        </div>
      </div>

      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-70">
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Determines if only the selected "sticky items" should be shown in the dimensionality
                reduction visual (needs at least 3 "sticky items" selected)
              </div>
            </span>
            <a>
              <div class="toggle-container">
                <p>Only sticky items?</p>
                <input
                  @click="updateOnlyDimReductionBasedOnStickyItems($event)"
                  type="checkbox"
                  class="toggle"
                  :checked="heatmapStore.getActiveDataTable?.showOnlyStickyItemsInDimReduction"
                />
              </div>
            </a>
          </div>
        </li>
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>Determines the algorithm used for the Dimensionality Reduction Visual</div>
              <div><strong>PCA:</strong> Principal Component Analysis</div>
              <div><strong>t-SNE:</strong> t-Distributed Stochastic Neighbor Embedding</div>
              <div><strong>UMAP:</strong> Uniform Manifold Approximation and Projection</div>
            </span>

            <a style="display: flex">
              <div>Algorithm:</div>
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
                    >{{ mapDimReductionAlgoEnum(dimReductionAlgo) }}</a
                  >
                </li>
              </ul>
            </a>
          </div>
        </li>
      </ul>
    </div>

    <div style="z-index: 99999998" class="dropdown dropdown-bottom">
      <div class="self-tooltip">
        <span class="tooltiptext">
          <div>
            Here are the settings on how the items (rows) of the heatmap are grouped together
          </div>
        </span>
        <div tabindex="0" class="btn m-1">
          <SettingsIcon style="height: 20px; width: 20px" />
          <p>Items Grouping</p>
        </div>
      </div>

      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>Determines how many sub-groups are directly inside a group</div>
              <div>Use a small value like 2 to get a very concise view of the data</div>
              <div>
                Use a large value like 30 to get a broader view of the data to detect outliers more
                easily
              </div>
            </span>
            <a class="toggle-container">
              <div>Size:</div>
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
          </div>
        </li>
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Determines if the grouping should initially be based on the selected grouping layers
              </div>
              <div>
                Enable this if you want to compare single items against the aggregation of an entire
                group and if you want to see outliers inside a group easily
              </div>
              <div>Disable this if you want to find global outliers</div>
            </span>

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
          </div>
        </li>
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Determines if the grouping of the items should be done based on the result of the
                Dimensionality Reduction
              </div>
              <div>
                Enable this if you want the groups in the heatmap to reflect closely what the
                Dimensionality Reduction visual looks like
              </div>
              <div>
                Disable this if you want the grouping to be done on the original data and not the
                compressed/simplified result of the Dimensionality Reduction
              </div>
            </span>
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
          </div>
        </li>
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Determines if the items should be grouped based on only the selected "sticky
                attributes"
              </div>
              <div>
                Enable this if you are only interested in comparing the items based on the selected
                "sticky attributes"
              </div>
              <div>Disable this if you want to compare the items based on all attributes</div>
            </span>
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
          </div>
        </li>

        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Determines if the data should be scaled (=all attributes have mean 0 and standard
                deviation 1 across all items) before applying the Dimensionality Reduction and
                grouping of the items.
              </div>
              <div>
                Enable scaling if you want all attributes to have the same weight in the
                Dimensionality Reduction and grouping of the items.
              </div>
              <div>Disable scaling if you intend to have "more important" attributes</div>
            </span>
            <a class="toggle-container">
              <div>Scaling:</div>

              <ul class="menu menu-vertical bg-base-200">
                <li
                  :key="scaling"
                  :style="{ border: 'none' }"
                  v-for="scaling in Object.values(ScalingEnum)"
                >
                  <a
                    @click="updateScaling(scaling)"
                    :class="{
                      'bg-green-700 text-white':
                        heatmapStore.getActiveDataTable?.scaling === scaling,
                    }"
                    >{{ mapScalingEnum(scaling) }}</a
                  >
                </li>
              </ul>
            </a>
          </div>
        </li>
      </ul>
    </div>

    <div style="z-index: 99999997" class="dropdown dropdown-bottom">
      <div class="self-tooltip">
        <span class="tooltiptext">
          <div>Here are the settings on how the attributes (columns) of the heatmap are sorted</div>
        </span>
        <div tabindex="0" role="button" class="btn m-1">
          <SettingsIcon style="height: 20px; width: 20px" />
          <p>Attributes</p>
        </div>
      </div>

      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72">
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right"
              ><div>Determines the order in which the attributes should be sorted</div>
              <div>
                <strong>Standard Deviation:</strong> The attribute which has the highest standard
                deviation across all items is in the first position
              </div>
              <div>
                <strong>Ascending:</strong> The attribute which has the lowest summed value across
                all items is in the first position
              </div>
              <div><strong>Descending:</strong> The reversed version of "Ascending"</div>
              <div><strong>Alphabetical:</strong> The attributes are sorted alphabetically</div>
            </span>
            <a class="toggle-container">
              <div>Order:</div>
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
                    >{{ mapSortOderAttributesEnum(sortOrder) }}</a
                  >
                </li>
              </ul>
            </a>
          </div>
        </li>

        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Determines if the selected attribute "Order" from the setting above should be based
                only on the selected "sticky items"
              </div>
              <div>
                Enable this if you want to compare only the "sticky items" based on their attributes
              </div>
              <div>Disable this if you want to compare all items based on their attributes</div>
            </span>
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
          </div>
        </li>
      </ul>
    </div>

    <div style="z-index: 99999997" class="dropdown dropdown-bottom">
      <div tabindex="0" role="button" class="btn m-1">
        <SettingsIcon style="height: 20px; width: 20px" />
        <p>Other</p>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72">
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>Determines how the individual cells of the heatmaps are colored</div>
              <div>
                <strong>Absolute:</strong> The lowest value cell across the heatmap has the lightest
                color, the highest value cell has the darkest color, the rest is linearly
                interpolated
              </div>
              <div>
                <strong>Logarithmic:</strong> The lowest value cell across the heatmap has the
                lightest color, the highest value cell has the darkest color, the rest is
                logarithmically interpolated
              </div>
              <div>
                <strong>Item Relative:</strong> The lowest value cell of each item has the lightest
                color, the highest value cell of each item has the darkest color -> per row there is
                a lightest and darkest colored cell
              </div>
              <div>
                <strong>Attribute Relative:</strong> The lowest value cell of each attribute has the
                lightest color, the highest value cell of each attribute has the darkest color ->
                per column there is a lightest and darkest colored cell
              </div>
            </span>
            <a class="toggle-container">
              <div>Cell Colors:</div>
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
                    >{{ mapColoringHeatmapEnum(coloringHeatmap) }}</a
                  >
                </li>
              </ul>
            </a>
          </div>
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
.self-tooltip {
  position: relative;
  display: inline-block;
}

.self-tooltip .tooltiptext {
  visibility: hidden;
  width: 300px;
  background-color: darkgray;
  color: black;
  padding: 8px;
  border-radius: 6px;
  top: 100%;
  left: 0%;
  text-wrap: pretty;
  hyphens: auto;
  font-size: 16px;

  position: absolute;
  z-index: 10000000;

  display: flex;
  flex-direction: column;
  gap: 5px;
}

.self-tooltip .tooltiptext-right {
  visibility: hidden;
  width: 300px;
  background-color: darkgray;
  color: black;
  padding: 8px;
  border-radius: 6px;
  top: 0%;
  left: 105%;
  text-wrap: pretty;
  hyphens: auto;
  font-size: 16px;

  position: absolute;
  z-index: 10000000;

  display: flex;
  flex-direction: column;
  gap: 8px;
}

.self-tooltip:hover .tooltiptext-right {
  visibility: visible;
}

.self-tooltip:hover .tooltiptext {
  visibility: visible;
}

.settings-container {
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
  justify-content: space-between;
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
  top: 19px;
  width: 4px;
  height: 15px;
  background-color: #000;
}

.color-scale:before {
  left: 1px;
}

.color-scale:after {
  right: 1px;
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
