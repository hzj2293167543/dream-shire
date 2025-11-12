<template>
  <div ref="songPlayerRef" class="song-player-container">
    <div class="song-player">
      <div class="song-audio-container">
        <audio ref="audioRef" class="song-audio" controls src="/mp3/spectral-monologue.mp3"></audio>
      </div>
      <ul
        class="song-list"
        :style="{
          transform: `translateZ(0) translateY(${translateY})`
        }"
      >
        <li
          class="song-item"
          v-for="({ timestamp, content }, index) in songData"
          :key="timestamp"
          :class="{ active: index === currentLyricIndex }"
        >
          {{ content }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { light } from './composables/song-data/song';
  import { getCurrentIndex, parseLyric } from './composables/utils/songPlayer';
  const audioRef = ref<InstanceType<typeof HTMLAudioElement>>(); // 明确类型
  const songPlayerRef = ref<InstanceType<typeof HTMLDivElement>>(); // 明确类型
  // 常量
  const lineHeight = 50;
  const container = 780;
  const songData = parseLyric(light.lyric);
  // 当前
  const currentLyricIndex = ref(0);
  /**
   * 计算歌词列表 translateY 值
   */
  const translateY = computed(() => {
    const containerCenter = container / 2;
    return `${containerCenter - currentLyricIndex.value * lineHeight}px`;
  });
  /**
   * 时间更新事件处理
   */
  const onTimeUpdate = () => {
    if (!audioRef.value) return;
    const index = getCurrentIndex(audioRef.value.currentTime, songData);
    if (index !== currentLyricIndex.value) {
      currentLyricIndex.value = index;
    }
  };
  /**
   * 挂载时添加时间更新事件监听
   */
  onMounted(() => {
    audioRef.value?.addEventListener('timeupdate', onTimeUpdate);
    songPlayerRef.value?.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'smooth' });
  });
  /**
   * 卸载时移除时间更新事件监听
   */
  onUnmounted(() => {
    audioRef.value?.removeEventListener('timeupdate', onTimeUpdate);
  });
</script>

<style lang="scss" scoped>
  .song-player-container {
    width: 100%;
    height: 100%;
    background-color: rgb(67, 52, 47);

    .song-player {
      @include FCC(column);
      .song-audio-container {
        width: fit-content;
        height: 200px;
        z-index: 1;
        background-color: rgb(67, 52, 47);
        .song-audio {
          margin: 50px;
          width: 500px;
          z-index: 1;
        }
      }

      overflow: hidden;
      .song-list {
        @include FSC(column);
        width: 100%;
        height: v-bind('container + "px"');
        // --ty: v-bind(translateY);
        // transform: translateZ(0) translateY(var(--ty));
        transition: transform 0.3s ease-in-out;
        // will-change: transform;
        // backface-visibility: hidden; // ✅ 防止闪烁
        // perspective: 1000px; // ✅ 3D 图层

        // --ty: 0px;
        // transform: translateY(var(--ty));
        // transition: transform 10s ease-in-out;
        &:hover {
          --ty: 500px !important; // 鼠标放上去应该10秒动画
        }
        .song-item {
          text-align: center;
          font-size: 20px;
          line-height: v-bind('lineHeight + "px"');
          height: v-bind('lineHeight + "px"');
          transition:
            transform 0.3s ease-in-out,
            color 0.3s ease-in-out;
          transform: scale(1);
          color: rgb(135, 126, 124);
        }
        .active {
          transform: scale(1.2);
          color: rgb(255, 255, 255);
        }
      }
    }
  }
</style>
