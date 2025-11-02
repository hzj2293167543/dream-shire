<template>
  <!-- <component :is="layout"> -->
  <RouterView />
  <!-- </component> -->
</template>
<script setup lang="ts">
  //   import { computed } from 'vue';
  //   import { useRoute } from 'vue-router';
  //   import DefaultLayout from '@/layouts/default.vue';

  //   const route = useRoute();

  //   const layout = computed(() => {
  //     const name = (route.meta?.layout as string) || 'default';
  //     if (name === 'default') return DefaultLayout;

  //     // 动态加载其他布局
  //     return () => import(`@/layouts/${name}.vue`);
  //   });
</script>

<style scoped>
  /* .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}
.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
} */
</style>
