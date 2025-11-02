export function debounce() {}
/**
 * 节流函数
 * @param fn        要节流的原始函数
 * @param wait      毫秒，间隔多久最多执行一次
 * @param options   leading 是否立即执行；trailing 是否在尾部再补一次；
 * @returns         返回被节流后的函数（含 .cancel() 方法）
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean } | boolean
): T & { cancel(): void } {
  // 兼容旧接口 throttle(fn, wait, true/false)
  let leading = true;
  let trailing = true;
  if (typeof options === 'boolean') {
    leading = options;
  } else if (options) {
    leading = options.leading !== false;
    trailing = options.trailing !== false;
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;
  let lastCallTime = 0;

  function invokeFn() {
    fn.apply(lastThis, lastArgs!);
    lastArgs = lastThis = null as any;
  }

  function startTimer() {
    timer = setTimeout(() => {
      timer = null;
      if (trailing && lastArgs) invokeFn();
      lastCallTime = Date.now();
    }, wait);
  }

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastThis = this;
    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      // 首次或间隔已够
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastCallTime = now;
      if (leading) invokeFn();
      else startTimer(); // 仅 trailing 场景
    } else if (!timer && trailing) {
      startTimer();
    }
  } as T & { cancel(): void };

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = lastArgs = lastThis = null as any;
    lastCallTime = 0;
  };

  return throttled;
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 */
export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

/**
 * 计算 RGB 颜色的灰度值
 * @param r 红色通道值（0-255）
 * @param g 绿色通道值（0-255）
 * @param b 蓝色通道值（0-255）
 * @returns 灰度值（0-255）
 */
export function gray(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

type QueryValue = string | string[];

/**
 * 解析 URL 查询串，支持重复 key
 * @param url  完整 URL 或纯 query 串
 * @param repeatable  是否把重复 key 聚合成数组
 */
export function parseQuery<T extends boolean = false>(
  url: string,
  repeatable?: T
): T extends true ? Record<string, QueryValue> : Record<string, string> {
  const q: Record<string, QueryValue> = Object.create(null);

  url.replace(/[?&]+([^=&]+)=([^&]*)/g, (_: string, k: string, v: string) => {
    const key = decodeURIComponent(k);
    const val = decodeURIComponent(v);

    if (repeatable) {
      const prev = q[key];
      q[key] = prev === undefined ? val : Array.isArray(prev) ? [...prev, val] : [prev, val];
    } else {
      q[key] = val;
    }
    return '';
  });

  return q as any; // 类型体操无法完全推断，用 any 断言
}

/**
 * 生成随机颜色（16 进制字符串）
 * @returns 随机颜色（如 #ff3366）
 */
export function randomColor() {
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padEnd(6, '0')
  );
}

/**
 * 从 HTML 字符串中提取文本内容，移除标签
 * @param fragment  HTML 字符串片段
 * @returns         提取后的文本内容
 */
export function removeTag(fragment: string) {
  return new DOMParser().parseFromString(fragment, 'text/html').body.textContent || '';
}

/**
 * 获取日期是该年的第几天
 * @param date  日期对象
 * @returns     第几天（1-366）
 */
export function dayOfYear(date: Date) {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
}

/**
 * 从对象中提取指定属性，返回新对象
 * @param obj   源对象
 * @param props 要提取的属性名数组
 * @returns     新对象，包含指定属性
 */
export function pick(obj: { [s: string]: unknown } | ArrayLike<unknown>, ...props: string[]) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => props.includes(k)));
}

/**
 * 生成随机字符串
 * @param length  字符串长度（默认 10）
 * @returns       随机字符串
 */
export function randomString(length = 10) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}
