<template>
  <div class="layout">
    <Header />
    <main>
      <!-- <span>默认布局</span> -->
      <RouterView />
    </main>
    <footer></footer>
  </div>
</template>

<script setup lang="ts">
  import Header from '@/components/header/Header.vue';
</script>

<style lang="scss" scoped>
  .layout {
    @include FSS(column);

    main {
      flex: 1;
      width: 100%;
      height: calc(100% - 100px);
    }
    footer {
      flex: 0;
      width: 100%;
      height: 0;
    }
  }
</style>
