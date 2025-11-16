<template>
  <div ref="playerRef" class="song-player" :style="styleVar">
    <div class="song-audio-container">
      <audio
        ref="audioRef"
        class="song-audio"
        controls
        :src="props.src"
        @loadedmetadata="onReady"
        @error="onError"
        @timeupdate="onTimeUpdate"
      ></audio>
    </div>
    <ul v-if="isReady" class="song-list" :style="listStyle">
      <li
        class="song-item"
        v-for="({ timestamp, content }, index) in lyrics"
        :key="timestamp"
        :class="{ active: index === currentLyricIndex }"
      >
        {{ content }}
      </li>
    </ul>
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { light } from './composables/song-data/song';
  import { findLyricIndex, parseLyric } from './composables/utils/songPlayer';
  import { throttle } from '@/utils/utils';
  interface SongPlayerConfig {
    lineHeight: number;
    containerHeight: number;
    throttleMs: number;
  }
  interface Props {
    src?: string;
    lyric?: string;
    config?: SongPlayerConfig;
  }

  // 2. 使用 withDefaults
  const props = withDefaults(defineProps<Props>(), {
    src: new URL(
      window.location.origin + '/mp3/spectral-monologue.mp3',
      import.meta.url
    ).toString(), // 字符串直接写
    lyric: light.lyric, // 字符串直接写
    config: () => ({
      // 对象用函数
      lineHeight: 50,
      containerHeight: 780,
      throttleMs: 50
    })
  });

  // DOM 元素引用
  const audioRef = ref<HTMLAudioElement>();
  const playerRef = ref<HTMLDivElement>(); // 明确类型
  const isReady = ref(false);

  // 常量
  const config = props.config;
  const styleVar = computed(() => ({
    '--line-height': `${config.lineHeight}px`,
    '--container-height': `${config.containerHeight}px`
  }));
  // 数据
  const lyrics = parseLyric(props.lyric);
  const currentLyricIndex = ref(0);

  /**
   * 计算歌词列表 translateY 值
   */
  const listStyle = computed(() => {
    // 居中公式：容器一半高度 - 当前索引行高 - 半行偏移
    const offset =
      config.containerHeight / 2 -
      config.lineHeight * currentLyricIndex.value -
      config.lineHeight / 2;
    return {
      transform: `translateY(${offset}px)`
    };
  });
  /**
   * 时间更新事件处理，添加节流
   */
  const onTimeUpdate = throttle((e: Event) => {
    const audio = e.target as HTMLAudioElement;
    currentLyricIndex.value = findLyricIndex(audio.currentTime, lyrics);
  }, config.throttleMs); // 配置节流时间
  /**
   * 挂载时添加时间更新事件监听
   */
  onMounted(() => {
    playerRef.value?.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'smooth' });
  });

  // ==================== 事件处理 ====================
  const onReady = () => {
    isReady.value = true;
    console.log('音频加载完成');
  };

  const onError = (e: Event) => {
    const audio = e.target as HTMLAudioElement;
    console.error('音频加载失败:', audio.error);
  };

  // ==================== 暴露 API ====================
  defineExpose({
    play: () => audioRef.value?.play(),
    pause: () => audioRef.value?.pause(),
    seek: (time: number) => {
      if (audioRef.value) audioRef.value.currentTime = time;
    }
  });
</script>

<style lang="scss" scoped>
  .song-player {
    @include FCC(column);
    width: 100%;
    height: 100%;
    background-color: rgb(67, 52, 47);
    overflow: hidden;
    .loading {
      @include FCC;
      width: 100%;
      height: calc(var(--container-height));
      font-size: 24px;
      color: rgb(135, 126, 124);
    }
    .song-audio-container {
      @include FCC;
      height: calc(var(--container-height) / 4);
      z-index: 1;
      width: 100%;
      background-color: rgb(67, 52, 47);
      .song-audio {
        width: 50%;
        z-index: 1;
      }
    }
    .song-list {
      @include FSC(column);
      width: 100%;
      height: var(--container-height);
      transition: transform 0.3s ease-in-out;

      .song-item {
        text-align: center;
        font-size: 20px;
        line-height: var(--line-height);
        height: var(--line-height);
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
</style>
