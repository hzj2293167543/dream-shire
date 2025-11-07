<template>
  <div class="export-fire">
    <button @click="handleDownCSV">export csv</button>
  </div>
</template>

<script setup lang="ts">
  import { useExportFile } from './composables/useExportFile';
  const { downloadCSV } = useExportFile();
  const handleDownCSV = () => downloadCSV();
</script>

<style lang="scss" scoped>
  .export-fire {
  }
</style>
