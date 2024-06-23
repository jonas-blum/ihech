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
  type ItemNameAndData,
} from '@/helpers/helpers'
import { useHeatmapStore } from '@/stores/heatmapStore'
import SettingsIcon from '@assets/settings.svg'
import { ref } from 'vue'
import SingleSelect from './SingleSelect.vue'

const heatmapStore = useHeatmapStore()

const selectedItem = ref<ItemNameAndData | null>(null)

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

function makeItemStickyAndExpandItem(item: ItemNameAndData | null) {
  if (!item) return
  if (!heatmapStore.getStickyItems.includes(item)) {
    heatmapStore.toggleStickyItem(item)
  }
  heatmapStore.expandItemAndAllParents(item)
}
</script>

<template>
  <div class="settings-container">
    <div style="z-index: 99999999" class="dropdown dropdown-bottom">
      <div class="self-tooltip">
        <span class="tooltiptext-right"
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
      </ul>
    </div>

    <div style="z-index: 99999998" class="dropdown dropdown-bottom">
      <div class="self-tooltip">
        <span class="tooltiptext-right">
          <div>
            Here are the settings on how the items (rows) of the heatmap are grouped together
          </div>
        </span>
        <div tabindex="0" class="btn m-1">
          <SettingsIcon style="height: 20px; width: 20px" />
          <p>Items Grouping</p>
        </div>
      </div>

      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-62">
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>Determines how many sub-groups are directly inside a group</div>
              <div>Use a small value like 2 to get an aggregated view of the data</div>
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
                Determines if the grouping should initially be based on the selected collection
                layers.
              </div>
              <div>
                Enable this if you want to compare single items against the aggregation of an entire
                collection, compare collections against other collections and if you want to see
                outliers inside a collection easily
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
      </ul>
    </div>

    <div style="z-index: 99999997" class="dropdown dropdown-bottom">
      <div class="self-tooltip">
        <span class="tooltiptext-right">
          <div>
            Here are the settings on how the attributes (columns) of the heatmap are ordered
          </div>
        </span>
        <div tabindex="0" role="button" class="btn m-1">
          <SettingsIcon style="height: 20px; width: 20px" />
          <p>Attributes Ordering</p>
        </div>
      </div>

      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72">
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right"
              ><div>Determines the order in which the attributes should be ordered</div>
              <div>
                <strong>Standard Deviation:</strong> The attribute which has the highest standard
                deviation across all items is in the first position
              </div>
              <div>
                <strong>Ascending:</strong> The attribute which has the lowest summed value across
                all items is in the first position
              </div>
              <div><strong>Descending:</strong> The reversed version of "Ascending"</div>
              <div><strong>Alphabetical:</strong> The attributes are ordered alphabetically</div>
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
                <p>Order based on sticky items?</p>
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

    <div style="z-index: 99999996" class="dropdown dropdown-bottom">
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
        <li>
          <div class="self-tooltip">
            <span class="tooltiptext-right">
              <div>
                Type to search for an item name and select it to see the item in the heatmap
              </div>
              <div>Additionally the selected item will be added to the "sticky items" section</div>
            </span>
            <a>
              <SingleSelect
                :options="heatmapStore.getAllItems"
                :selected="selectedItem"
                @select="makeItemStickyAndExpandItem"
              />
            </a>
          </div>
        </li>
      </ul>
    </div>

    <button
      @click="reloadHeatmap()"
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
  display: none;
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

  flex-direction: column;
  gap: 8px;
}

.self-tooltip:hover .tooltiptext-right {
  display: flex;
}

.self-tooltip:hover .tooltiptext {
  display: flex;
}

.settings-container {
  display: flex;
  align-items: center;
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
</style>
