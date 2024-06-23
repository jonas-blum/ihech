<script setup lang="ts">
import { onMounted } from 'vue'
import ArrowRight from '@assets/arrow-right.svg'
import collectionsFew from '@assets/collections_few.png'
import collectionsAll from '@assets/collections_all.png'
import stickyAttributes from '@assets/sticky_attributes.png'
import attributeSelection from '@assets/attribute_selection.png'
import similarItems from '@assets/similar_items.png'
import stickyItems from '@assets/sticky_items.png'
import itemsComparing from '@assets/items_comparing.png'
import itemsAverage from '@assets/items_average.png'
import collectionsAverage from '@assets/collections_average.png'
import itemsCollections from '@assets/items_collections.png'
import itemsCollections2 from '@assets/items_collections2.png'
import comparingCollections from '@assets/comparing_collections.png'
import byCollections from '@assets/by_collections.png'
import attributesOrdering from '@assets/attributes_ordering.png'
import comparingAttributes from '@assets/comparing_attributes.png'
import globalOutliers from '@assets/global_outliers.png'
import globalOutliersSettings from '@assets/global_outliers_settings.png'
import collectionOutliers from '@assets/collection_outliers.png'
import collectionOutliersSettings from '@assets/collection_outliers_settings.png'

onMounted(() => {
  const modal = document.getElementById('my_modal_1') as any
  modal.showModal()
})
</script>

<template>
  <button class="btn btn-info" onclick="my_modal_1.showModal()">Guide</button>
  <dialog id="my_modal_1" class="modal">
    <div class="modal-box" style="max-width: 90vw">
      <form method="dialog">
        <button class="btn btn-md btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h1 class="font-bold text-3xl">IHECH Guide</h1>
      <h2 class="font-bold text-xl mt-5">What is IHECH?</h2>
      <p>
        The Interactive Hierarchically Expandable Cluster Heatmap (IHECH) is a combination of a
        heatmap and a dimensionality reduction visual which aims to support users in their
        explorative data analysis of large volumes of hierarchical multi dimensional data. <br />
        The IHECH specifically allows for the identification of clusters, outliers, the comparison
        of items across attributes on different granularity levels and the comparison of attributes
        across items of different granularity levels.
      </p>
      <h2 class="font-bold text-xl mt-5">Terms</h2>
      <p>
        The rows of the data-matrix are called items. <br />
        The columns of the data-matrix are called attributes. <br />
        The groups of the first hierarchy layer are called collections.
      </p>
      <h2 class="font-bold text-xl mt-5">Use Cases / Tasks</h2>

      <h3 class="font-bold text-l mt-4">1. Delineate exploration space by selecting collections</h3>
      <p>
        By using the <i>Collection Selector</i> in the bottom left, specific collections can be
        unselected.
      </p>
      <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-end mt-3">
        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="collectionsAll" alt="Collection All" />
          <span class="text-sm text-gray-600">All collections are selected.</span>
        </div>

        <ArrowRight class="w-10 h-10 self-center" />

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="collectionsFew" alt="Collection Few" />
          <span class="text-sm text-gray-600">Only collections of interest are selected.</span>
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">2. Delineate exploration space by selecting attributes</h3>
      <p>
        Attributes which are not of interest can be unselected in the <i>File Upload</i>. <br />
        Attributes of interest can be made sticky by clicking on the <strong>+</strong> icon.
        Performing the grouping of items based on only the attributes of interest, can be done in
        the <i>Items Grouping</i> setting.
      </p>

      <div class="grid grid-cols-[1fr_1fr] gap-4 items-end mt-3">
        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="attributeSelection" alt="Collection All" />
          <span class="text-sm text-gray-600">The <i>index</i> attribute is unselected.</span>
        </div>

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="stickyAttributes" alt="Collection Few" />
          <span class="text-sm text-gray-600"
            >Four attributes are selected as sticky attributes.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">
        3. Find the most similar items to a specific item based on selected attributes
      </h3>

      <p>
        The most similar items to an item are the ones which are located in the same group as an
        item.
      </p>
      <div class="grid grid-cols-[1fr_1fr] gap-4 items-end mt-3">
        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="similarItems" alt="Collection Few" />
          <span class="text-sm text-gray-600"
            >Three similar items which are located in the same group.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">4. Compare items against items based on selected attributes</h3>

      <div class="grid grid-cols-[1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="stickyItems" alt="Collection All" />
          <span class="text-sm text-gray-600">Items can be compared by making them sticky.</span>
        </div>

        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="itemsComparing" alt="Collection Few" />
          <span class="text-sm text-gray-600"
            >Items can also be compared without making them sticky.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">
        5. Compare items against the average of all items based on selected attributes
      </h3>

      <div class="grid grid-cols-[1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="itemsAverage" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >An item can be compared against the average of all items by making it sticky.</span
          >
        </div>

        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="collectionsAverage" alt="Collection Few" />
          <span class="text-sm text-gray-600"
            >A collection can be compared against the average of all items.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">
        6. Compare items against collections based on selected attributes
      </h3>

      <div class="grid grid-cols-[1fr_1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="itemsCollections" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >An item can be compared against a collection by making the item sticky.</span
          >
        </div>

        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="itemsCollections2" alt="Collection Few" />
          <span class="text-sm text-gray-600"
            >An item can be compared against a collection without making the item sticky</span
          >
        </div>

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="byCollections" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >The <i>By Collections?</i> setting must be enabled</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">
        7. Compare collections against collections based on selected attributes
      </h3>

      <div class="grid grid-cols-[1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="comparingCollections" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >The similarity of collections can be compared using the
            <i>Dimensionality Reduction Visual</i> or the <i>Heatmap</i></span
          >
        </div>

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="byCollections" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >The <i>By Collections?</i> setting must be enabled</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">8. Compare attributes across selected items</h3>

      <div class="grid grid-cols-[1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="comparingAttributes" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >Attributes can be compared using the <i>Heatmap</i>.</span
          >
        </div>

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="attributesOrdering" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >Attributes can be ordered in different ways to help with the comparison.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">
        9. Detect outlier items across all items based on selected attributes
      </h3>

      <div class="grid grid-cols-[1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="globalOutliers" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >Global Outliers are located in groups with only one item.</span
          >
        </div>

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="globalOutliersSettings" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >The <i>By Collections</i> setting must be turned off and an appropriate grouping size
            must be set such that outliers are located in their own group.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <h3 class="font-bold text-l">
        10. Detect outlier items within a collection based on selected attributes
      </h3>

      <div class="grid grid-cols-[1fr_1fr] gap-6 items-end mt-3">
        <div class="flex flex-col gap-1 items-center">
          <img class="max-h-[30vh]" :src="collectionOutliers" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >Collection outliers are located in groups with only one item inside a "collection
            group" (here: Outlier in "Königsfelden" collection visible).</span
          >
        </div>

        <div class="flex flex-col items-center">
          <img class="max-h-[30vh]" :src="collectionOutliersSettings" alt="Collection All" />
          <span class="text-sm text-gray-600"
            >The <i>By Collections</i> setting must be turned on and an appropriate grouping size
            must be set such that outliers are located in their own group within a collection.</span
          >
        </div>
      </div>

      <div class="divider"></div>

      <div class="w-full flex items-center justify-center">
        <button class="btn btn-info" onclick="my_modal_1.close()">Close</button>
      </div>
    </div>
  </dialog>
</template>
