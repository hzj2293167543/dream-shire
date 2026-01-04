import { ref, readonly, onMounted, onUnmounted, Ref } from 'vue';

// 类型定义
export interface DraggableOptions {
  handle?: string;
  boundary?: boolean;
  keepZIndex?: boolean;
  horizontal?: boolean;
  vertical?: boolean;
  onStart?: (data: DragData) => void;
  onDrag?: (data: DragData) => void;
  onEnd?: (data: DragData) => void;
}

export interface DragData {
  el: HTMLElement;
  x: number;
  y: number;
}

export interface DraggableBinding {
  value: string | DraggableOptions;
  modifiers: {
    horizontal?: boolean;
    vertical?: boolean;
  };
}

export interface DraggableElement extends HTMLElement {
  _draggableCleanup?: () => void;
}

/**
 * 获取页面中最大的z-index值
 */
const getMaxZIndex = (): number => {
  const elements = document.querySelectorAll('*');
  let max = 0;
  elements.forEach((el) => {
    const z = parseInt(window.getComputedStyle(el).zIndex);
    if (z > max) max = z;
  });
  return max;
};

/**
 * 确保元素有定位属性
 */
const ensurePosition = (el: HTMLElement): void => {
  const position = window.getComputedStyle(el).position;
  if (position === 'static') {
    el.style.position = 'relative';
  }
};

/**
 * 从transform矩阵中提取平移值
 */
const getTransformValues = (transform: string): { x: number; y: number } => {
  const matrix = new DOMMatrix(transform);
  return {
    x: matrix.m41 || 0,
    y: matrix.m42 || 0
  };
};

/**
 * Vue 3 拖拽指令实现
 */
export const vDraggable = {
  mounted(el: DraggableElement, binding: DraggableBinding): void {
    const options: DraggableOptions =
      typeof binding.value === 'string' ? { handle: binding.value } : binding.value || {};

    // 应用修饰符
    if (binding.modifiers.horizontal) options.horizontal = true;
    if (binding.modifiers.vertical) options.vertical = true;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let originalZIndex: string;
    let originalPosition: string;

    const handleEl = options.handle ? (el.querySelector(options.handle) as HTMLElement) : el;
    if (!handleEl) return;

    const onStart = (e: MouseEvent | TouchEvent): void => {
      e.preventDefault();
      isDragging = true;

      // 存储原始样式
      originalZIndex = window.getComputedStyle(el).zIndex;
      originalPosition = window.getComputedStyle(el).position;

      ensurePosition(el);

      // 设置超高z-index确保在最上层
      el.style.zIndex = (getMaxZIndex() + 1).toString();
      el.classList.add('dragging');

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      startX = clientX;
      startY = clientY;

      const transform = window.getComputedStyle(el).transform;
      const transformValues = getTransformValues(transform);
      initialX = transformValues.x;
      initialY = transformValues.y;

      // 添加事件监听器
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);

      // 触发回调
      options.onStart?.({ el, x: initialX, y: initialY });
    };

    const onMove = (e: MouseEvent | TouchEvent): void => {
      if (!isDragging) return;
      e.preventDefault();

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      let deltaX = clientX - startX;
      let deltaY = clientY - startY;

      // 应用方向限制
      if (options.horizontal) deltaY = 0;
      if (options.vertical) deltaX = 0;

      let x = initialX + deltaX;
      let y = initialY + deltaY;

      // 边界限制
      if (options.boundary) {
        const parent = el.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          x = Math.max(0, Math.min(x, parentRect.width - elRect.width));
          y = Math.max(0, Math.min(y, parentRect.height - elRect.height));
        }
      }

      el.style.transform = `translate(${x}px, ${y}px)`;

      // 触发拖拽回调
      options.onDrag?.({ el, x, y });
    };

    const onEnd = (): void => {
      if (!isDragging) return;
      isDragging = false;

      el.classList.remove('dragging');

      // 恢复原始z-index（可选）
      if (options.keepZIndex !== true) {
        el.style.zIndex = originalZIndex === 'auto' ? '' : originalZIndex;
      }

      // 移除事件监听器
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);

      // 触发结束回调
      const transform = window.getComputedStyle(el).transform;
      const transformValues = getTransformValues(transform);
      options.onEnd?.({ el, x: transformValues.x, y: transformValues.y });
    };

    // 添加事件监听器
    handleEl.addEventListener('mousedown', onStart);
    handleEl.addEventListener('touchstart', onStart, { passive: false });

    // 清理函数
    el._draggableCleanup = () => {
      handleEl.removeEventListener('mousedown', onStart);
      handleEl.removeEventListener('touchstart', onStart);
    };
  },

  unmounted(el: DraggableElement): void {
    if (el._draggableCleanup) {
      el._draggableCleanup();
      delete el._draggableCleanup;
    }
  }
};

/**
 * 组合式API风格的拖拽钩子
 * @param elementRef - 要拖拽的元素引用
 * @param options - 拖拽选项
 * @returns 拖拽状态和位置信息
 */
export function useDraggable(elementRef: Ref<HTMLElement | null>, options: DraggableOptions = {}) {
  const isDragging = ref(false);
  const position = ref({ x: 0, y: 0 });

  onMounted(() => {
    if (!elementRef.value) return;

    const el = elementRef.value;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const onStart = (e: MouseEvent | TouchEvent): void => {
      e.preventDefault();
      isDragging.value = true;

      ensurePosition(el);
      el.style.zIndex = (getMaxZIndex() + 1000).toString();
      el.classList.add('dragging');

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      startX = clientX;
      startY = clientY;

      const transformValues = getTransformValues(window.getComputedStyle(el).transform);
      initialX = transformValues.x;
      initialY = transformValues.y;

      options.onStart?.({ el, x: initialX, y: initialY });
    };

    const onMove = (e: MouseEvent | TouchEvent): void => {
      if (!isDragging.value) return;
      e.preventDefault();

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      let deltaX = clientX - startX;
      let deltaY = clientY - startY;

      if (options.horizontal) deltaY = 0;
      if (options.vertical) deltaX = 0;

      let x = initialX + deltaX;
      let y = initialY + deltaY;

      if (options.boundary && el.parentElement) {
        const parentRect = el.parentElement.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        x = Math.max(0, Math.min(x, parentRect.width - elRect.width));
        y = Math.max(0, Math.min(y, parentRect.height - elRect.height));
      }

      position.value = { x, y };
      el.style.transform = `translate(${x}px, ${y}px)`;

      options.onDrag?.({ el, x, y });
    };

    const onEnd = (): void => {
      if (!isDragging.value) return;
      isDragging.value = false;

      el.classList.remove('dragging');

      const transformValues = getTransformValues(window.getComputedStyle(el).transform);
      options.onEnd?.({ el, x: transformValues.x, y: transformValues.y });
    };

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

    onUnmounted(() => {
      el.removeEventListener('mousedown', onStart);
      el.removeEventListener('touchstart', onStart);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    });
  });

  return {
    isDragging: readonly(isDragging),
    position: readonly(position)
  };
}

// 兼容Vue 2的默认导出（保持向后兼容）
export default vDraggable;
