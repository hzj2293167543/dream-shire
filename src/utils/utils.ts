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
