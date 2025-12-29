// src/shims-vue.d.ts
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

declare global {
  interface Window {
    $modal: {
      show: (options: Record<string, any>) => void;
      hide: () => void;
    };
  }
}
