<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <div class="operations">
      <button
        v-for="op in operations"
        :key="op"
        class="operation-button"
        @mousedown.prevent="toggleFormat(op)"
        :class="{ active: activeTag === op }"
      >
        {{ op }}
      </button>
    </div>

    <!-- 编辑区 -->
    <div
      ref="editorRef"
      class="editor"
      contenteditable
      @mouseup="updateActive"
      @keyup="updateActive"
    >
      <p>选一段文字试试~</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

type Cmd = "粗体" | "斜体" | "下划线";
const tagMap: Record<Cmd, string> = {
  粗体: "B",
  斜体: "I",
  下划线: "U",
};
const operations: Cmd[] = ["粗体", "斜体", "下划线"];

const editorRef = ref<HTMLDivElement>();
const activeTag = ref<Cmd | "">(""); // 当前激活的按钮

/* ---------------- 主入口 ---------------- */
function toggleFormat(cmd: Cmd) {
  const tag = tagMap[cmd];
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  if (range.collapsed) return; // 未选中文字

  // 如果已经包裹了相同标签 →  unwrap
  if (isWrapped(range, tag)) {
    unwrap(range, tag);
  } else {
    wrap(range, tag);
  }

  // 恢复选区并刷新激活状态
  sel.removeAllRanges();
  sel.addRange(range);
  updateActive();
}

/* ---------------- wrap ---------------- */
function wrap(range: Range, tagName: string) {
  const node = document.createElement(tagName);
  try {
    range.surroundContents(node);
  } catch (e) {
    // 选区跨元素时会抛异常，降级处理：提取再包裹
    const content = range.extractContents();
    node.appendChild(content);
    range.insertNode(node);
  }
}

/* ---------------- unwrap ---------------- */
function unwrap(range: Range, tagName: string) {
  const node = range.commonAncestorContainer;
  const wrapper =
    node.nodeType === Node.TEXT_NODE
      ? node.parentElement!.closest(tagName)
      : (node as Element).closest(tagName);

  if (wrapper) {
    const parent = wrapper.parentNode!;
    while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
    parent.removeChild(wrapper);
  }
}

/* ---------------- 辅助 ---------------- */
function isWrapped(range: Range, tagName: string): boolean {
  const node = range.commonAncestorContainer;
  const el =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  return !!el?.closest(tagName);
}

function updateActive() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  for (const cmd of operations) {
    if (isWrapped(range, tagMap[cmd])) {
      activeTag.value = cmd;
      return;
    }
  }
  activeTag.value = "";
}
</script>

<style scoped lang="scss">
.editor-container {
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
