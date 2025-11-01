<template>
  <div class="editor-container">
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
</template>

<script setup lang="ts">
  import { useEditor } from './composables/useEditor';
  const { activeTag, updateActive, toggleFormat, tagMap, operations } = useEditor();
</script>

<style scoped lang="scss">
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
</style>
