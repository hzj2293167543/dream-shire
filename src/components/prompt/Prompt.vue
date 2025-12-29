<template>
  <transition name="el-zoom-in-center">
    <Teleport to="#app">
      <div
        :class="[props.styleName ? `theme-${props.styleName}` : 'theme-base-style']"
        v-if="visible"
        ref="currentDom"
        :style="{
          '--bg': theme?.bgColor || '#000',
          '--text': theme?.textColor || '#fff',
          '--border': theme?.borderColor || '#000'
        }"
      >
        <div class="modal-header">
          <!-- <img style="width: 3vw; margin-right: 0.5vw" src="@/assets/images/header-gif.gif" alt="" /> -->
          <h2>{{ title }}</h2>
          <span class="close-content close" @click="handleClose"></span>
        </div>
        <!-- <p class="code">CG-P-10214</p> -->
        <div class="modal-body">
          <div class="container">
            <div class="resource" v-if="resourceData">
              <div class="text">{{ resourceData.label }}</div>
              <video
                v-if="resourceData.type === 'video'"
                :src="resourceData.value"
                controls
                autoplay
                muted
              ></video>
              <img v-else-if="resourceData.type === 'image'" :src="resourceData.value" />
            </div>
            <div class="content">
              <div class="container-item" v-for="(item, index) in contentData" :key="index">
                <div
                  class="container-item-title tooltip"
                  :data-title="overflowStates[index]?.label ? item.label : ''"
                >
                  <span class="tooltip-text">{{ item.label }}</span>
                </div>
                <div
                  class="container-item-content tooltip"
                  :data-title="overflowStates[index]?.content ? item.value : ''"
                >
                  <span class="tooltip-text">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </transition>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch, Teleport } from 'vue';

  // 定义类型接口
  interface ContentItem {
    key: string;
    label: string;
    value: string;
  }

  interface Resource {
    type: 'video' | 'image';
    label: string;
    value: string;
  }

  interface Position {
    x: number;
    y: number;
  }

  // 定义props
  const props = defineProps<{
    visible: boolean;
    content?: ContentItem[];
    resource?: Resource;
    width?: number;
    height?: number;
    title?: string;
    position?: Position[];
    theme?: {
      bgColor: string;
      textColor: string;
      borderColor: string;
    };
    styleName?: string;
    closeCallback?: () => void;
  }>();

  // 定义emit事件
  const emit = defineEmits<{
    'update:visible': [value: boolean];
    close: [];
  }>();

  const contentData = computed(() => props.content);
  const resourceData = computed(() => props.resource);

  const handleClose = () => {
    props?.closeCallback?.();
    emit('close');
  };

  const ellipsisTextRefs = ref<HTMLElement[]>([]);
  const currentDom = ref<HTMLElement | null>(null);

  // 使用ref数组来动态检测溢出 - 现在为每个项目存储两个状态（标签和内容）
  const overflowStates = ref<{ label: boolean; content: boolean }[]>([]);

  // 检测所有文本是否溢出
  const checkTextOverflow = () => {
    setTimeout(() => {
      // 获取所有container-item元素
      const containerItems = document.querySelectorAll('.container-item');
      if (containerItems && containerItems.length > 0) {
        overflowStates.value = Array.from(containerItems).map((item, index) => {
          const labelEl = item.querySelector('.container-item-title.ellipsis-text') as HTMLElement;
          const contentEl = item.querySelector(
            '.container-item-content.ellipsis-text'
          ) as HTMLElement;

          // 调试信息
          console.log(`Item ${index} elements:`, { labelEl, contentEl });

          // 检查label元素的宽度
          const labelScrollWidth = labelEl?.scrollWidth || 0;
          const labelClientWidth = labelEl?.clientWidth || 0;
          console.log(`Item ${index} label widths:`, {
            scrollWidth: labelScrollWidth,
            clientWidth: labelClientWidth
          });

          // 检查content元素的宽度
          const contentScrollWidth = contentEl?.scrollWidth || 0;
          const contentClientWidth = contentEl?.clientWidth || 0;
          console.log(`Item ${index} content widths:`, {
            scrollWidth: contentScrollWidth,
            clientWidth: contentClientWidth
          });

          const labelOverflow =
            labelEl && labelScrollWidth > 0 && labelClientWidth > 0
              ? labelScrollWidth > labelClientWidth
              : false;
          const contentOverflow =
            contentEl && contentScrollWidth > 0 && contentClientWidth > 0
              ? contentScrollWidth > contentClientWidth
              : false;

          console.log(`Item ${index} overflow:`, {
            label: labelOverflow,
            content: contentOverflow
          });

          return {
            label: labelOverflow,
            content: contentOverflow
          };
        });
      }
    }, 300); // 增加延迟时间，确保元素完全渲染
  };

  // 监听内容变化，重新检测溢出
  watch(
    [contentData, () => props.visible],
    () => {
      if (props.visible) {
        overflowStates.value = [];
        checkTextOverflow();
      }
    },
    { deep: true }
  );

  // 组件挂载后检测溢出
  onMounted(() => {
    checkTextOverflow();
  });

  // 监听窗口大小变化，重新检测溢出
  watch(
    () => window.innerWidth,
    () => {
      if (props.visible) {
        checkTextOverflow();
      }
    }
  );

  // Simplified center positioning using CSS transform instead of JS calculation
  const dialogPosition = computed(() => {
    return [0, 0]; // Position at top-left, then use CSS to center
  });
</script>

<style lang="scss" scoped>
  @use '@/components/prompt/styles/baseStyle.scss' as *;
  @use '@/components/prompt/styles/secondStyle.scss' as *;
  @include baseStyle;
  @include secondStyle;

  .tooltip {
    width: 100%;
    position: relative;
  }

  .tooltip-text {
    display: block;
    width: 100%;
    overflow: hidden;
    cursor: pointer;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 自定义 tooltip 主体 */
  .tooltip::after {
    content: attr(data-title); /* 从 data-title 读取内容 */
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    white-space: nowrap;
    font-size: 14px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s;
    z-index: 1000;
  }

  /* 小箭头 */
  .tooltip::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #333;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s;
  }

  /* 悬停显示 */
  .tooltip:hover::after,
  .tooltip:hover::before {
    opacity: 1;
    visibility: visible;
  }
</style>
