/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'virtual:generated-pages' {
  import type { RouteRecordRaw } from 'vue-router';
  const routes: RouteRecordRaw[];
  export default routes;
}
