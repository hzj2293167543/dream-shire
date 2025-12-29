import { throttle } from '@/utils/utils';
import { onMounted, onUnmounted, ref } from 'vue';

export const useEditor = () => {
  type Cmd = '粗体' | '斜体' | '下划线';
  type Tag = 'B' | 'EM' | 'U';
  const tagMap: Record<Cmd, Tag> = {
    粗体: 'B',
    斜体: 'EM',
    下划线: 'U'
  };
  const operations: Cmd[] = ['粗体', '斜体', '下划线'];

  const editorRef = ref<HTMLDivElement>();
  const activeTag = ref<Tag[]>([]); // 当前激活的按钮

  /* ---------------- 主入口 ---------------- */
  function toggleFormat(cmd: Cmd) {
    const tag = tagMap[cmd];
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    // 如果已经包裹了相同标签 → unwrap
    if (range.collapsed) {
      handleCollapsed(sel, range, tag);
      return;
    } else {
      // 正常处理选中文本的情况
      if (hasWrappedTags(tag)) {
        unwrap(range, tag);
      } else {
        wrap(range, tag);
      }
    }

    // 恢复选区并刷新激活状态
    sel.removeAllRanges();
    sel.addRange(range);
    updateActive();
  }

  /**
   * 处理折叠选区的情况（光标在文本节点内）
   * @param sel 当前选区
   * @param range 当前选区范围
   * @param tag 要操作的标签
   * @returns
   */
  function handleCollapsed(sel: Selection, range: Range, tag: Tag) {
    const textNode = findNextText(range);
    if (!textNode) return;

    // 1. 同时保存节点引用和 Range 标记
    // 记录文本节点的"身份标识"（用 Range 标记它在编辑器中的位置）
    const targetNode = textNode;
    const originalOffset = range.startContainer === textNode ? range.startOffset : 0;
    const nodeMarker = document.createRange();
    nodeMarker.selectNode(textNode); // 标记整个节点

    // 2. 记录父元素（用于 unwrap 后查找）
    const parentElement = textNode.parentElement;

    // 3. 执行格式化
    const formatRange = document.createRange();
    formatRange.selectNodeContents(targetNode);
    const isWrapped = hasWrappedTags(tag);

    if (isWrapped) {
      unwrap(formatRange, tag);
    } else {
      wrap(formatRange, tag);
    }

    // 4. 根据操作类型选择不同的恢复策略
    let finalNode: Node | null = null;

    if (!isWrapped) {
      // ✅ wrap 后：在标记位置查找格式化后的第一个有效节点
      // nodeMarker 现在指向 <b> 元素（因为文本节点被包裹）
      const wrapper =
        nodeMarker.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? (nodeMarker.commonAncestorContainer as Element).querySelector(tag)
          : nodeMarker.commonAncestorContainer.parentElement?.querySelector(tag) || null;

      if (wrapper) {
        // 在包裹元素内查找第一个非空文本节点（绝对安全）
        const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) =>
            (node.textContent || '').trim().length > 0
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_SKIP
        });
        finalNode = walker.nextNode();
      }
    } else {
      // ✅ unwrap 后：用父元素 + 原始节点双重保险定位
      // 文本节点被提升回原父级，targetNode 引用通常仍有效
      if (document.body.contains(targetNode) && targetNode.textContent) {
        // 优先使用原始节点引用（最准确）
        finalNode = targetNode;
      } else if (parentElement && document.body.contains(parentElement)) {
        // 如果原始节点失效，用父元素查找
        const walker = document.createTreeWalker(parentElement, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) =>
            (node.textContent || '').trim().length > 0
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_SKIP
        });
        finalNode = walker.nextNode();
      }
    }

    // 5. 最终验证
    if (!finalNode || !finalNode.textContent || !document.body.contains(finalNode)) {
      console.error('无法定位有效节点，光标恢复失败');
      // 最后的 fallback：将光标放在操作位置的附近
      const fallbackRange = document.createRange();
      fallbackRange.selectNodeContents(editorRef.value!);
      fallbackRange.collapse(true);
      sel.addRange(fallbackRange);
      updateActive();
      return;
    }

    // 6. 重建光标（始终在原始字符偏移位置）
    const newRange = document.createRange();
    const maxOffset = finalNode.textContent?.length || 0;
    const finalOffset = Math.min(originalOffset, maxOffset);

    newRange.setStart(finalNode, finalOffset);
    newRange.collapse(true);

    sel.removeAllRanges();
    sel.addRange(newRange);
    updateActive();
  }
  /**
   * 查找光标后的第一个有效文本节点
   * @param range 当前选区
   * @returns 文本节点或 null
   */
  function findNextText(range: Range): Text | null {
    const container = range.startContainer;
    const offset = range.startOffset;
    const editor = editorRef.value;
    console.log(container, offset, editorRef, editor);

    if (!editor) return null;

    // 创建树遍历器，只返回有效文本节点
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // 跳过纯格式化空白和空文本
        if (isInsignificantWhitespace(node)) {
          return NodeFilter.FILTER_SKIP;
        }
        const text = node.textContent || '';
        if (text.trim().length === 0) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    // 情况1: 光标在文本节点内
    if (container.nodeType === Node.TEXT_NODE) {
      const textNode = container as Text;
      const text = textNode.textContent || '';

      // 如果光标不在末尾，返回当前节点（格式化当前节点）
      if (offset < text.length) {
        return textNode;
      }

      // 光标在末尾，查找下一个
      walker.currentNode = textNode;
      const nextNode = walker.nextNode();
      return nextNode as Text | null;
    }

    // 情况2: 光标在元素节点上
    walker.currentNode = container;
    const nextNode = walker.nextNode();
    return nextNode as Text | null;
  }

  /* ---------------- 辅助函数 ---------------- */
  /**
   * 判断是否是格式化空白（可删除的换行、制表等）
   */
  function isInsignificantWhitespace(node: Node): boolean {
    if (node.nodeType !== Node.TEXT_NODE) return false;
    const text = node.nodeValue || '';

    // 必须全是空白符
    if (!/^\s*$/.test(text)) return false;

    // 如果包含普通空格或 &nbsp;，认为用户想保留
    if (/[ \u00A0]/.test(text)) return false;

    // 在 <pre> 或 white-space:pre* 环境保留
    if (node.parentElement?.closest('pre, [style*="white-space:pre"]')) return false;

    return true; // 纯格式化空白，可删
  }

  /**
   * 把 elem 子树里所有相邻/嵌套的同名标签合并成一层
   * @param elem     要扫描的根（即刚插入的 <b>）
   * @param tagName  要合并的标签名，如 'B'
   */
  function mergeAdjacentSameTags(parent: Element, tagName: string) {
    let cur: Element | null = parent.firstElementChild;
    while (cur) {
      // 下一个“节点”（可能是 Text）
      let next = cur.nextSibling;
      while (next && isInsignificantWhitespace(next)) {
        next = next.nextSibling;
      }

      // 只有当下一个节点**本身就是元素**且同名才合并
      if (next && next.nodeType === Node.ELEMENT_NODE) {
        const nextEl = next as Element;
        if (cur.tagName === tagName && nextEl.tagName === tagName) {
          // 搬家
          while (nextEl.firstChild) cur.appendChild(nextEl.firstChild);
          parent.removeChild(nextEl);
          // 继续检查 cur 和新 next（不移动指针）
          continue;
        }
      }

      cur = cur.nextElementSibling;
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
    } catch {
      wrapCrossRange(range, tagName);
    }

    // stripIndentTexts(node.parentElement!);
    // 🔽 保证不套娃
    mergeAdjacentSameTags(node.parentElement!, tagName);

    // 重新框选 node 内部，方便后续 unwrap
    range.selectNodeContents(node);
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
    } else {
      unwrapCrossRange(range, tagName);
    }
    // 解包时合并相邻标签
    // mergeAdjacentSameTags(node.parentElement!, node.nodeType);
  }

  function unwrapCrossRange(range: Range, tagName: string): void {
    // 1. 克隆选区内容
    const fragment = range.cloneContents(); // <DocumentFragment>

    // 2. 收集 fragment 内所有目标标签
    const wrappers: HTMLElement[] = [];
    const iter = document.createNodeIterator(fragment, NodeFilter.SHOW_ELEMENT, (n) =>
      n.nodeName === tagName.toUpperCase() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    );
    let node: Element | null;
    while ((node = iter.nextNode() as Element)) wrappers.push(node as HTMLElement);

    // 3. 对每一段 wrapper 做「解包」
    wrappers.forEach((wrapper) => {
      const parent = wrapper.parentNode!;
      while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
      parent.removeChild(wrapper);
      clearEmptyTag(wrapper);
    });

    // 4. 删除原选区内容，把解包后的 fragment 插回去
    range.deleteContents();
    range.insertNode(fragment); // 此时 fragment 里已没有 wrapper 标签
  }

  /**
   * 从指定节点开始，向上递归删除所有「空」祖先
   * 空 = 没有文本、没有元素子节点
   * @param node 起点（一般传 wrapper 本身）
   */
  function clearEmptyTag(node: Node): void {
    let current: Node | null = node;
    while (current) {
      const parent: ParentNode | null = current.parentNode;
      if (!parent) break;

      // 判断当前节点是否“空”
      const isEmpty = current.nodeType === Node.ELEMENT_NODE && current.textContent!.trim() === '';

      if (!isEmpty) break;

      parent.removeChild(current);
      current = parent; // 继续向上
    }
  }
  /* ---------------- 辅助 ---------------- */
  function isWrapped(tagName: string): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    // 1. 拿到用户选区所在的行（这里简单用"同一个 Text"当一行，
    //    如果编辑器里一行就是一个 p/div，可换成 closest('p') 之类的逻辑）
    const userRange = sel.getRangeAt(0);
    const startContainer = userRange.startContainer;

    // 2. 临时 Range：从行首开始
    const tempRange = userRange.cloneRange();
    tempRange.collapse(true); // 收拢到起点
    // 让选区往前挪到"行首"——浏览器原生 API
    tempRange.setStart(startContainer, 0);
    tempRange.collapse(true);

    // 3. 取到行首那个字符节点
    const firstNode = tempRange.startContainer;
    const el =
      firstNode.nodeType === Node.TEXT_NODE ? firstNode.parentElement : (firstNode as Element);

    // 4. 检测
    const wanted = tagName.toUpperCase();
    return Boolean(el?.closest(wanted));
  }

  const getWrappedTags = () => {
    const wrapped: Tag[] = [];
    for (const op of operations) {
      if (isWrapped(tagMap[op])) {
        wrapped.push(tagMap[op]);
      }
    }
    return wrapped;
  };

  const hasWrappedTags = (tag: Tag) => {
    return getWrappedTags().includes(tag);
  };

  function updateActive() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    activeTag.value = getWrappedTags();
  }

  const onMouseMove = throttle(
    (e: MouseEvent) => {
      if (!(e.buttons & 1)) return;
      updateActive();
      return;
    },
    2e2,
    { leading: true }
  );
  onMounted(() => {
    document.addEventListener('mousemove', onMouseMove);
  });
  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove);
  });
  return {
    activeTag,
    onMouseMove,
    updateActive,
    toggleFormat,
    tagMap,
    operations,
    editorRef
  };
};
