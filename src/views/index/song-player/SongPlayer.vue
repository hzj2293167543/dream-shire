<template>
  <div class="song-player-container">
    <div class="song-player">
      <audio class="song-audio" controls src="/mp3/spectral-monologue.mp3"></audio>
      <ul class="song-list">
        <li class="song-item" v-for="(item, index) in 300" :key="item">{{ item * index }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';

  const transformY = ref(0);
  const intervalId = ref();
  onMounted(() => {
    intervalId.value = setInterval(() => {
      transformY.value -= 5;
    }, 200);
  });
  onUnmounted(() => {
    clearInterval(intervalId.value);
  });
</script>

<style lang="scss" scoped>
  .song-player-container {
    width: 100%;
    height: 100%;
    background-color: rgb(67, 52, 47);

    .song-player {
      @include FCC(column);
      .song-audio {
        margin: 50px;
      }
      .song-list {
        @include FCC(column);
        width: 100%;
        height: 500px;
        overflow: hidden;

        .song-item {
          transform: scale(1) translateY(v-bind('transformY + "px"'));
          transition: transform 0.2s ease-in-out;
          text-align: center;
          font-size: 20px;
          line-height: 50px;
          height: 50px;
          color: rgb(135, 126, 124);
          &:active {
            transform: scale(1.2) translateY(v-bind('transformY + "px"'));
            color: rgb(255, 255, 255);
          }
        }
      }
    }
  }
</style>
