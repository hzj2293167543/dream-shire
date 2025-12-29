// src/utils/modal.ts
import { createApp, App } from 'vue';
import Modal from '@/components/prompt/Prompt.vue'; // 替换为您的实际路径

// 全局弹窗管理器（TypeScript友好版）
interface ModalManager {
  instance: App | null;
  show(options: Record<string, any>): void;
  hide(): void;
}

const ModalManager: ModalManager = {
  instance: null,
  show(options: Record<string, any> = {}) {
    if (this.instance) {
      // 如果实例已存在，先销毁旧实例
      this.hide();
    }

    // 创建新的Vue 3应用实例
    this.instance = createApp(Modal, {
      ...options,
      visible: true,
      // 监听关闭事件
      onClose: () => this.hide()
    });

    // 挂载到DOM
    const container = document.createElement('div');
    document.body.appendChild(container);
    this.instance.mount(container);
  },
  hide() {
    if (this.instance) {
      const container = this.instance._container;
      this.instance.unmount();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      this.instance = null;
    }
  }
};

// 挂载到全局（TypeScript会自动识别）
(window as any).$modal = ModalManager;

