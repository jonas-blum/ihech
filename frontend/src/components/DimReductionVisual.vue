<script setup lang="ts">
import { ref, watch } from 'vue'
import { type ItemNameAndData, getDistinctEditionsOfRow } from '@helpers/helpers'

import * as d3 from 'd3'
import { useHeatmapStore } from '@stores/heatmapStore'

const datavizRef = ref(null)

const props = defineProps<{
  width: number
}>()

const heatmapStore = useHeatmapStore()

function getVisibleRowsRecursively(row: ItemNameAndData): ItemNameAndData[] {
  if (!row.isOpen || row.children === null) {
    return [row]
  } else if (row.isOpen && row.children) {
    return row.children.flatMap((child: ItemNameAndData) => getVisibleRowsRecursively(child))
  }
  return []
}

function getAllVisibleRows(): ItemNameAndData[] {
  if (heatmapStore.isOnlyStickyItemsShownInDimReduction && heatmapStore.getStickyItems.length > 2) {
    return heatmapStore.getStickyItems
  }
  return (
    heatmapStore.getHeatmap?.itemNamesAndData.flatMap((row: ItemNameAndData) =>
      getVisibleRowsRecursively(row)
    ) || []
  )
}

function getMaxMinRecursively(row: ItemNameAndData, max: boolean, x: boolean): number {
  if (row.children === null) {
    return x ? row.dimReductionX : row.dimReductionY
  }
  return row.children.reduce(
    (acc: number, child: ItemNameAndData) => {
      const value = getMaxMinRecursively(child, max, x)
      if (max) {
        return Math.max(acc, value)
      } else {
        return Math.min(acc, value)
      }
    },
    x ? row.dimReductionX : row.dimReductionY
  )
}

function getMaxMinStickyItems(max: boolean, x: boolean): number {
  const startingNumber = max ? Number.MIN_VALUE : Number.MAX_VALUE

  return heatmapStore.getStickyItems.reduce((acc: number, row: ItemNameAndData) => {
    const value = getMaxMinRecursively(row, max, x)
    if (max) {
      return Math.max(acc, value)
    } else {
      return Math.min(acc, value)
    }
  }, startingNumber)
}

function isRowCollapsible(row: ItemNameAndData) {
  return !heatmapStore.getHeatmap.itemNamesAndData.includes(row)
}

function isRowChildOfRow(row: ItemNameAndData, parent: ItemNameAndData): boolean {
  if (row === parent) {
    return true
  }
  if (parent.children) {
    return parent.children.some((child) => isRowChildOfRow(row, child))
  }
  return false
}

function isParentHighlighted(row: ItemNameAndData): boolean {
  if (row === heatmapStore.getHighlightedRow) {
    return true
  }
  if (!row?.parent) {
    return false
  }
  let parent: ItemNameAndData | null = row.parent
  while (parent) {
    if (parent === heatmapStore.getHighlightedRow) {
      return true
    }
    parent = parent.parent
  }
  return false
}

function updateCirclesOpacity() {
  const groups = d3.selectAll('g')
  groups.each(function (row: ItemNameAndData) {
    d3.select(this)
      .selectAll('path')
      .style('opacity', isParentHighlighted(row) ? 1 : 0.6)
  })
}

watch(
  () => heatmapStore.getHighlightedRow,
  () => {
    updateCirclesOpacity()
  }
)

watch(
  () => heatmapStore.getDataChanging,
  () => {
    drawScatterplot()
  }
)

function drawScatterplot() {
  let container = document.getElementById('pca-visualization-container')
  if (!container) {
    return
  }

  var margin = { top: 15, right: 15, bottom: 15, left: 15 },
    width = props.width - margin.left - margin.right,
    height = props.width - margin.top - margin.bottom

  var svg = d3.select(datavizRef.value).select('svg')
  if (!svg.empty()) {
    svg.remove()
  }
  svg = d3
    .select(datavizRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .on('contextmenu', (event) => event.preventDefault())

  var g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const data = getAllVisibleRows()

  let minX = heatmapStore.getDimRedMinXValue
  let maxX = heatmapStore.getDimRedMaxXValue
  let minY = heatmapStore.getDimRedMinYValue
  let maxY = heatmapStore.getDimRedMaxYValue

  if (heatmapStore.isOnlyStickyItemsShownInDimReduction && heatmapStore.getStickyItems.length > 2) {
    minX = getMaxMinStickyItems(false, true)
    maxX = getMaxMinStickyItems(true, true)
    minY = getMaxMinStickyItems(false, false)
    maxY = getMaxMinStickyItems(true, false)
  }

  var x = d3.scaleLinear().domain([minX, maxX]).range([0, width])
  var y = d3.scaleLinear().domain([minY, maxY]).range([height, 0])

  var arcs = g.selectAll('g').data(data)

  arcs
    .enter()
    .append('g')
    .attr(
      'transform',
      (row: ItemNameAndData) => `translate(${x(row.dimReductionX)},${y(row.dimReductionY)})`
    )
    .each(function (row: ItemNameAndData) {
      const editionColorList = ['blue']
      const pie = d3.pie()(editionColorList.map(() => 1))
      let radius = Math.log10(Math.sqrt(row.amountOfDataPoints)) * 20 + 5
      if (row.amountOfDataPoints === 1) {
        if (heatmapStore.getStickyItems.includes(row)) {
          radius *= 1.5
        }
      }

      const arc = d3.arc().innerRadius(0).outerRadius(radius)
      d3.select(this)
        .selectAll('path')
        .data(pie)
        .enter()
        .append('path')
        .attr('d', arc)
        .style('fill', (_, i) => editionColorList[i])
        .style('stroke', row.children ? 'black' : 'none')
        .style('stroke-width', () => {
          if (!isRowCollapsible(row)) {
            return 5
          }
          if (row.children) {
            return 2
          }
          return 0
        })
        .style('opacity', isParentHighlighted(row) ? 1 : 0.6)
    })
    .style('cursor', 'pointer')
    .style('z-index', (row: ItemNameAndData) => row.amountOfDataPoints)
    .on('click', function (event, row: ItemNameAndData) {
      event.stopPropagation()
      event.preventDefault()

      if (!row.children) {
        heatmapStore.toggleStickyItem(row)
      } else {
        heatmapStore.expandRow(row)
      }
    })
    .on('contextmenu', function (event, row: ItemNameAndData) {
      heatmapStore.closeNearestOpenParent(row)
    })
    .on('mouseover', function (event, row: ItemNameAndData) {
      heatmapStore.setHighlightedRow(row)
    })
    .on('mousemove', function (event) {})
    .on('mouseleave', function (event, row: ItemNameAndData) {
      heatmapStore.setHighlightedRow(null)
    })
    .append('title')
    .text(
      (row) =>
        `Name: ${row.itemName}\nEditions: ${Array.from(getDistinctEditionsOfRow(row)).join(', ')}`
    )
}
</script>

<template>
  <div id="pca-visualization-container" :style="{ width: props.width + 'px' }">
    <div ref="datavizRef"></div>
  </div>
</template>
