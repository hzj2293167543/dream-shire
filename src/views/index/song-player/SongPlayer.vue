<template>
  <div class="song-player">
    <ul class="song-list">
      <li class="song-item" v-for="item in 300" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
  .song-player {
  }
</style>
