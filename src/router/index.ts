import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import routes from 'virtual:generated-pages';
// const routes: RouteRecordRaw[] = [
//   { path: "/", name: "Home", component: () => import("@/views/index.vue") },
//   //   { path: '/about', name: 'About', component: () => import('@/views/About.vue') },
// ];

console.log(routes);
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
