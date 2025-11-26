<template>
  <div class="animations">
    <section class="parallax-scrolling">
      <div class="parallax-scrolling-container">
        <div v-for="item in parallaxItems" :key="item.alt" class="parallax-scrolling-item">
          <img :src="item.img" :alt="item.alt" />
          <div class="parallax-scrolling-item-content">
            <h3>{{ item.description }}</h3>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { parallaxItems } from './composables/datas/parallaxScrollingData';
</script>

<style lang="scss" scoped>
  .animations {
  }
</style>
