<template>
  <div class="animations">
    <section class="parallax-scrolling">
      <div
        v-for="(item, index) in parallaxItems"
        :key="item.alt"
        class="parallax-scrolling-item"
        :style="{ height: itemHeight + 'px' }"
        :ref="setItemRef(index)"
      >
        <!-- 单层结构，直接移动图片 -->
        <img :src="item.img" :alt="item.alt" class="bg-image" draggable="false" />

        <div class="content">
          <h3>{{ item.description }}</h3>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { parallaxItems } from './composables/datas/parallaxScrollingData';
  import { onMounted, onUnmounted, ref, computed } from 'vue';

  const itemRefs = ref<HTMLElement[]>([]);

  const setItemRef = (index: number) => (el: HTMLElement | null) => {
    if (el) itemRefs.value[index] = el;
  };

  const itemHeight = computed(() => window.innerHeight);

  onMounted(() => {
    gsap.registerPlugin(ScrollTrigger);

    const updateHeight = () => ScrollTrigger.refresh();
    window.addEventListener('resize', updateHeight);

    itemRefs.value.forEach((item, index) => {
      if (!item) return;

      const bgImage = item.querySelector('.bg-image') as HTMLElement;
      if (!bgImage) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // ✅ 移动图片本身，幅度小，不夸张
      gsap.fromTo(
        bgImage,
        { yPercent: -10 }, // 只向上移动10%
        {
          yPercent: 10, // 只向下移动10%
          ease: 'none',
          scrollTrigger: {
            trigger: item,
            start: 'top bottom',
            end: 'bottom top',
            scrub: prefersReducedMotion ? 0.5 : true,
            markers: process.env.NODE_ENV === 'development'
          }
        }
      );
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateHeight);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    });
  });
</script>

<style lang="scss" scoped>
  .animations {
    min-height: 100vh;
  }

  .parallax-scrolling-item {
    position: relative;
    overflow: hidden;
    width: 1920px;

    .bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1200px; /* ✅ 只放大20%，提供移动空间 */
      object-fit: cover; /* ✅ 保持比例，轻微裁剪 */
      z-index: 1;
      will-change: transform;
      user-select: none;
    }

    .content {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #fff;
      font-size: clamp(24px, 5vw, 48px);
      font-weight: bold;
      mix-blend-mode: difference;
      z-index: 2;
      padding: 2rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

      @media (prefers-reduced-motion: reduce) {
        position: relative;
        transform: none !important;
      }
    }
  }

  @media (max-width: 768px) {
    .parallax-scrolling-item .content {
      font-size: clamp(20px, 4vw, 32px);
      padding: 1rem;
    }
  }
</style>
