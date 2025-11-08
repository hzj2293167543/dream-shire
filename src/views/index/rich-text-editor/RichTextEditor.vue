<template>
  <div class="rich-text-editor">
    <div class="editor-container">
      <h2>自定义富文本编辑器</h2>
      <!-- 工具栏 -->
      <div class="operations">
        <button
          v-for="op in operations"
          :key="op"
          class="operation-button"
          @mousedown.prevent="toggleFormat(op)"
          :class="{ active: activeTag.includes(tagMap[op]) }"
        >
          {{ op }}
        </button>
      </div>
      <!-- 编辑区 -->
      <div
        ref="editorRef"
        class="editor"
        contenteditable
        spellcheck="false"
        @mouseup="updateActive"
        @keyup="updateActive"
      >
        <p>选一段文字试试~</p>
      </div>
    </div>
    <div class="tinymce-editor-container">
      <h2>tinymce 本地部署</h2>
      <TinyMCEEditor v-model="articleContent" :height="500" />

      <button @click="saveContent">保存</button>
      <div v-html="articleContent" class="preview"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useEditor } from './composables/useEditor';
  import TinyMCEEditor from './components/TinyMCE.vue';
  //   import { useTinyMCE } from './composables/useTinyMCE';

  const { activeTag, updateActive, toggleFormat, tagMap, operations } = useEditor();
  import { ref } from 'vue';

  const articleContent = ref('<p>请输入内容...</p>');

  function saveContent() {
    console.log('保存内容:', articleContent.value);
    // 发送到服务器...
  }
</script>

<style scoped lang="scss">
  .rich-text-editor {
    @include FCC(column);
    gap: 20px;
    .editor-container {
      margin: 0 auto;
      width: 420px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;

      .operations {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;

        .operation-button {
          padding: 5px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fafafa;
          cursor: pointer;
          transition: all 0.2s;

          &.active {
            background: #409eff;
            color: #fff;
            border-color: #409eff;
          }

          &:hover:not(.active) {
            background: #eee;
          }
        }
      }

      .editor {
        min-height: 120px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
        font-size: 0;
        * {
          font-size: 16px;
        }
        &:focus {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }

        /* 让包裹标签可视觉区分 */
        b {
          font-weight: bold;
        }
        i {
          font-style: italic;
        }
        u {
          text-decoration: underline;
        }
      }
    }

    .tinymce-editor-container {
      @include FCC(column);
      width: 500px;
    }
  }
</style>
