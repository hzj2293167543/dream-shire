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
    if (range.collapsed) return; // 未选中文字

    // 如果已经包裹了相同标签 →  unwrap
    console.log(hasWrappedTags(range, tag));
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
   * 判断是否是“格式化空白”（用户刻意留的空格或 &nbsp; 除外） 也就是排除\n \t \r
   * @param node 要检查的节点
   * @returns 是否是格式化空白
   */
  function isInsignificantWhitespace(node: Node): boolean {
    if (node.nodeType !== Node.TEXT_NODE) return false;
    const text = node.nodeValue || '';
    // 1. 必须全是空白符
    if (!/^\s*$/.test(text)) return false;
    // 2. 如果里面出现一个普通空格或 &nbsp;，就认为“用户想留”
    if (/[ \u00A0]/.test(text)) return false;
    // 3. 在 <pre> 或 white-space:pre* 环境里也不动
    if (node.parentElement?.closest('pre,[style*="white-space:pre"]')) return false;

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
      // 下一个“节点”（可能是 TextNode）
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
    } catch (e) {
      wrapCrossRange(range, tagName);
    }

    // stripIndentTextNodes(node.parentElement!);
    // 🔽 保证不套娃
    mergeAdjacentSameTags(node.parentElement!, tagName);

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

    console.log(wrapper);
    if (wrapper) {
      console.log(wrapper);
      const parent = wrapper.parentNode!;
      console.log(parent);
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
      const parent = current.parentNode;
      if (!parent) break;

      // 判断当前节点是否“空”
      const isEmpty = current.nodeType === Node.ELEMENT_NODE && current.textContent!.trim() === '';

      if (!isEmpty) break;

      parent.removeChild(current);
      current = parent; // 继续向上
    }
  }
  /* ---------------- 辅助 ---------------- */
  function isWrapped(range: Range, tagName: string): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    // 1. 拿到用户选区所在的行（这里简单用“同一个 TextNode”当一行，
    //    如果编辑器里一行就是一个 p/div，可换成 closest('p') 之类的逻辑）
    const userRange = sel.getRangeAt(0);
    const startContainer = userRange.startContainer;

    // 2. 临时 Range：从行首开始
    const tempRange = userRange.cloneRange();
    tempRange.collapse(true); // 收拢到起点
    // 让选区往前挪到“行首”——浏览器原生 API
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
    activeTag.value = getWrappedTags(range);
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
