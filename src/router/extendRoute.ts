import type { RouteRecordRaw } from 'vue-router';

/** 中划线 -> 驼峰 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 通用递归：每层都检查 /kebab-case/kebabcase 并精简，
 * 同时把当前层的 name 设为驼峰格式。
 */
export default function extendRoute(route: RouteRecordRaw): RouteRecordRaw {
  const parts = route.path.split('/').filter(Boolean); // 去掉空串

  // 从根到叶子逐层检查
  for (let i = 0; i < parts.length - 1; i++) {
    const kebab = parts[i]; // eg: song-player
    const next = parts[i + 1]; // eg: songplayer
    if (next === kebab.replace(/-/g, '')) {
      // 出现重复
      parts.splice(i + 1, 1); // 删掉多余段
    }
  }

  // 重新拼 path
  route.path = '/' + parts.join('/');
  if (route.path === '/home') {
    route.path = '';
  }

  // 当前层的 name 强制用“第一级 kebab”转驼峰
  if (parts.length) {
    route.name = kebabToCamel(parts[0]);
  }

  // 递归处理子路由
  if (route.children?.length) {
    route.children = route.children.map(extendRoute);
  }

  //   if (route.path.startsWith('/')) {
  //     route.meta = { ...route.meta, layout: 'default' };
  //   }
  return route;
}
