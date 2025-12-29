<template>
  <div class="export-fire">
    <button @click="handleDownCSV">export csv</button>
    <button @click="handleOpenPrompt">export csv</button>
    <!-- <Prompt
      :visible="true"
      :content="[
        {
          key: 'text',
          label: 'Are you sure you want to export the CSV file?',
          value: 'Are you sure you want to export the CSV file?'
        }
      ]"
      :resource="{
        type: 'image',
        label: 'export csv',
        value: 'export-csv'
      }"
      title="export csv"
      styleName=""
      :theme="{
        bgColor: 'rgba(255, 255, 255, 0.98)',
        textColor: '#1f2937',
        borderColor: 'rgba(59, 130, 246, 0.7)'
      }"
      @close="handleOpenPrompt"
    ></Prompt> -->
  </div>
</template>

<script setup lang="ts">
  import { useExportFile } from './composables/useExportFile';
  import Prompt from '@/components/prompt/Prompt.vue';
  const { downloadCSV } = useExportFile();
  const handleDownCSV = () => downloadCSV();
  const handleOpenPrompt = () => {
    (window as any).$modal.show({
      title: 'Export CSV',
      content: [
        {
          key: 'text',
          label: 'Are you sure you want to export the CSV file?',
          value: 'Are you sure you want to export the CSV file? '
        }
      ],
      resource: {
        type: 'image' as const,
        label: 'export csv',
        value: new URL('@/assets/imgs/logo.svg', import.meta.url).href
      },
      styleName: 'base-style',
      //   theme: {
      //     bgColor: 'rgba(255, 255, 255, 0.98)',
      //     textColor: '#1f2937',
      //     borderColor: 'rgba(59, 130, 246, 0.7)'
      //   },
      closeCallback: () => {
        console.log('closeCallback');
      }
    });
  };
</script>
<style lang="scss" scoped>
  .export-fire {
  }
</style>
