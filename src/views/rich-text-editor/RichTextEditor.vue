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
  import { ref } from 'vue';

  type Cmd = '粗体' | '斜体' | '下划线';
  type Tag = 'B' | 'I' | 'U';
  const tagMap: Record<Cmd, Tag> = {
    粗体: 'B',
    斜体: 'I',
    下划线: 'U'
  };
  const operations: Cmd[] = ['粗体', '斜体', '下划线'];

  const editorRef = ref<HTMLDivElement>();
  const activeTag = ref<Cmd | ''>(''); // 当前激活的按钮

  /* ---------------- 主入口 ---------------- */
  function toggleFormat(cmd: Cmd) {
    const tag = tagMap[cmd];
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return; // 未选中文字

    // 如果已经包裹了相同标签 →  unwrap
    if (hasWrappedTags(range, tag)) {
      unwrap(range, tag);
    } else {
      wrap(range, tag);
    }

    console.log(sel);
    // 恢复选区并刷新激活状态
    sel.removeAllRanges();
    sel.addRange(range);
    updateActive();
  }

  /**
   * 把 elem 子树里所有相邻/嵌套的同名标签合并成一层
   * @param elem     要扫描的根（即刚插入的 <b>）
   * @param tagName  要合并的标签名，如 'B'
   */
  function mergeAdjacentSameTags(elem: Element, tagName: string) {
    // ① 深度优先，先处理孙子，再处理儿子
    Array.from(elem.children).forEach((child) => {
      if (child.tagName === tagName) {
        mergeAdjacentSameTags(child, tagName); // 递归子树
      }
    });

    // ② 现在 child 里面已经没有同名孙节点了，可以安全合并
    let curr: Element | null = elem.firstElementChild;
    while (curr) {
      const next: Element | null = curr.nextElementSibling;
      if (curr.tagName === tagName) {
        // 把 curr 的内容全部移到 elem 里，位置就在 curr 之前
        elem.insertBefore(curr.firstChild!, curr); // 先移文本/元素
        while (curr.firstChild) elem.insertBefore(curr.firstChild, curr);
        elem.removeChild(curr); // 再删掉空壳
      }
      curr = next;
    }
  }
  // 跨标签处理
  function wrapCrossRange(range: Range, tagName: string) {
    const newParent = document.createElement(tagName);

    // 1️⃣ 整颗剪下
    const fragment = range.extractContents(); // DocumentFragment

    // 2️⃣ 塞进新标签
    newParent.appendChild(fragment);

    // 3️⃣ 插回原位
    range.insertNode(newParent);

    // 4️⃣ 选区重新框住新标签内部
    range.selectNodeContents(newParent);
  }
  /* ---------------- wrap ---------------- */
  function wrap(range: Range, tagName: string) {
    const node = document.createElement(tagName);
    try {
      range.surroundContents(node);
    } catch (e) {
      wrapCrossRange(range, tagName);
    }

    // 🔽 保证不套娃
    mergeAdjacentSameTags(node, tagName);

    // 重新框选 node 内部，方便后续 unwrap
    range.selectNodeContents(node);
  }

  /* ---------------- unwrap ---------------- */
  function unwrap(range: Range, tagName: string) {
    console.log(range, tagName);
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
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
    return Boolean(el?.closest(tagName));
  }

  const getWrappedTags = (range: Range) => {
    const wrapped: Tag[] = [];
    for (const op of operations) {
      if (isWrapped(range, tagMap[op])) {
        wrapped.push(tagMap[op]);
      }
    }
    return wrapped;
  };

  const hasWrappedTags = (range: Range, tag: Tag) => {
    return getWrappedTags(range).includes(tag);
  };

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
    activeTag.value = '';
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
