<template>
  <Header />
  <main>
    <RouterView />
  </main>
  <footer></footer>
</template>

<script setup lang="ts">
  import Header from '@/components/header/Header.vue';
</script>

<style lang="scss" scoped></style>
