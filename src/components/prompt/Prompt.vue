<template>
  <Teleport to="#app">
    <transition name="el-zoom-in-center">
      <div
        :class="currentThemeClass"
        v-if="visible"
        ref="currentDom"
        v-draggable
        :style="{
          '--bg': theme?.bgColor || '#000',
          '--text': theme?.textColor || '#fff',
          '--border': theme?.borderColor || '#000',
          left: dialogPosition[0] ? dialogPosition[0] + 'px' : '50%',
          top: dialogPosition[1] ? dialogPosition[1] + 'px' : '50%'
        }"
      >
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <span class="close-content close" @click="handleClose"></span>
        </div>
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
                  class="container-item-title tooltip-wrapper"
                  @mouseenter="showTooltip($event, item.label, 'label', index)"
                  @mouseleave="hideTooltip"
                >
                  <span class="tooltip-text">{{ item.label }}</span>
                </div>
                <div
                  class="container-item-content tooltip-wrapper"
                  @mouseenter="showTooltip($event, item.value, 'content', index)"
                  @mouseleave="hideTooltip"
                >
                  <span class="tooltip-text">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 全局 tooltip 容器 -->
    <Teleport to="body">
      <div
        v-if="activeTooltip.visible"
        class="global-tooltip"
        :style="{
          position: 'fixed',
          left: activeTooltip.x + 'px',
          top: activeTooltip.y + 'px',
          zIndex: 2147483000
        }"
      >
        {{ activeTooltip.content }}
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch, Teleport } from 'vue';
  import baseTheme from './styles/themes/base.module.scss';
  import secondTheme from './styles/themes/second.module.scss';
  /**
   * 根据主题名称动态切换主题类
   */
  const currentThemeClass = computed(() => {
    if (props.themeName === 'second') return secondTheme.themeSecond;
    return baseTheme.themeBase;
  });
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

  // 使用ref数组来动态检测溢出 - 现在为每个项目存储两个状态（标签和内容）
  const overflowStates = ref<{ label: boolean; content: boolean }[]>([]);

  // 全局tooltip状态
  const activeTooltip = ref({
    visible: false,
    content: '',
    x: 0,
    y: 0
  });

  // 显示全局tooltip
  const showTooltip = (
    event: MouseEvent,
    content: string,
    type: 'label' | 'content',
    index: number
  ) => {
    // 只有在文本溢出时才显示tooltip
    if (overflowStates.value[index]?.[type]) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      activeTooltip.value = {
        visible: true,
        content,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
    }
  };

  // 隐藏全局tooltip
  const hideTooltip = () => {
    activeTooltip.value.visible = false;
  };

  // 检测所有文本是否溢出
  const checkTextOverflow = () => {
    requestAnimationFrame(() => {
      // 获取所有container-item元素
      const containerItems = document.querySelectorAll('.container-item');
      if (containerItems && containerItems.length > 0) {
        overflowStates.value = Array.from(containerItems).map((item) => {
          const labelEl = item.querySelector('.container-item-title .tooltip-text') as HTMLElement;
          const contentEl = item.querySelector(
            '.container-item-content .tooltip-text'
          ) as HTMLElement;

          // 检查label元素的宽度
          const labelScrollWidth = labelEl?.scrollWidth || 0;
          const labelClientWidth = labelEl?.clientWidth || 0;

          // 检查content元素的宽度
          const contentScrollWidth = contentEl?.scrollWidth || 0;
          const contentClientWidth = contentEl?.clientWidth || 0;

          const labelOverflow =
            labelEl && labelScrollWidth > 0 && labelClientWidth > 0
              ? labelScrollWidth > labelClientWidth
              : false;
          const contentOverflow =
            contentEl && contentScrollWidth > 0 && contentClientWidth > 0
              ? contentScrollWidth > contentClientWidth
              : false;

          return {
            label: labelOverflow,
            content: contentOverflow
          };
        });
      }
    });
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
    return props.position || [0, 0]; // Position at top-left, then use CSS to center
  });
</script>
