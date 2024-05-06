<script setup lang="ts"></script>

<template>
  <h1>ExpandableHeatmap</h1>
  <ul class="menu menu-horizontal bg-base-200">
    <li v-for="absRel in [1, 2, 3]">
      <a>{{ absRel }}</a>
    </li>
  </ul>
  <button className="btn btn-primary">Test DaisyUI</button>
</template>
