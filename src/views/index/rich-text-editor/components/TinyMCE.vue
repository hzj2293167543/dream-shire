<template>
  <Editor
    api-key="no-api-key"
    v-model="content"
    tinymceScriptSrc="/tinymce/tinymce.min.js"
    :init="editorConfig"
  />
</template>

<script setup lang="ts">
  import Editor from '@tinymce/tinymce-vue';
  import { ref } from 'vue';

  const content = ref('');
  const editorConfig = {
    license_key: 'gpl',
    language: 'zh_CN',
    language_url: '/tinymce/langs/zh_CN.js',
    skin_url: '/tinymce/skins/ui/oxide',
    height: 500,
    plugins: 'link image code table',
    toolbar: 'undo redo | bold italic | link image | code'
  };
</script>

<style scoped lang="scss"></style>
