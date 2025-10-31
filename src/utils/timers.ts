// timerArray.ts
type TimerId = ReturnType<typeof setTimeout>;
type Path = string[];

/* ================= 内部池 + 树索引 ================= */
// 定时器池，存储定时器id
const pool = new Map<string, TimerId[]>();
// 定时器前缀key树，存储路径
const trie = new Map<string, Set<string>>();

/* ----------- 数组↔唯一 key ----------- */
// 路径分隔符
const SEP = '\x1F';
// 验证路径是否有效
function validatePath(p: Path): void {
  if (p.some((s) => s.includes(SEP))) throw new Error('path 不能包含分隔符');
  if (p.length === 0) throw new Error('path 不能为空');
}
// 路径转字符串
function pathToStr(p: Path): string {
  validatePath(p);
  return p.join(SEP);
}

/* ----------- 注册 / 取消 ----------- */
// 注册定时器
function regTimer(path: Path, id: TimerId): void {
  const key = pathToStr(path);
  if (!pool.has(key)) {
    pool.set(key, []);
  }
  pool.get(key)!.push(id);

  // 注册前缀key树
  for (let i = 1; i <= path.length; i++) {
    const prefix = pathToStr(path.slice(0, i));
    if (!trie.has(prefix)) {
      trie.set(prefix, new Set());
    }
    trie.get(prefix)!.add(key);
  }
}

// 取消注册定时器
function unregTimer(key: string): void {
  const timerIds = pool.get(key) || [];
  timerIds.forEach((id) => clearTimeout(id));
  pool.delete(key);
  // ✅ 修复：清理所有父节点中的引用
  const segments = key.split(SEP);
  for (let i = 1; i <= segments.length; i++) {
    const prefix = segments.slice(0, i).join(SEP);
    const trieNode = trie.get(prefix) || new Set();
    trieNode.delete(key);
    if (trieNode.size === 0) {
      trie.delete(prefix);
    }
  }
}

/* ----------- 通配/递归删除 ----------- */
// 取消注册定时器树
function cancelPath(path: Path): void {
  const prefix = pathToStr(path);
  const toDel = new Set<string>();

  // 1. 先把自己（当前路径）加进去
  if (pool.has(prefix)) toDel.add(prefix);
  const visited = new Set<string>();

  // 递归删除子树
  const queue = [prefix];
  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    const children = trie.get(current) || new Set();
    children.forEach((child) => {
      if (pool.has(child)) toDel.add(child);
      queue.push(child);
    });
  }
  toDel.forEach((key) => unregTimer(key));
}

/* ================= 对外 API ================= */
// 注册定时器
export function setTimeoutWithKey(fn: () => void, timeout: number, path: Path): TimerId {
  validatePath(path);
  const id = setTimeout(fn, timeout);
  regTimer(path, id);
  return id;
}
// 取消注册定时器
export function clearTimeoutWithKey(path: Path): void {
  validatePath(path);
  cancelPath(path);
}
// // 取消注册定时器树
// export function clearTimeoutTree(path: Path): void {
//   validatePath(path);
//   cancelPath(path);
// }
// // 取消注册定时器子树
// export function clearTimeoutWildcard(path: Path): void {
//   validatePath(path);
//   cancelPath(path, false);
// }
// 取消注册所有定时器
export function clearTimeoutAll(): void {
  Array.from(pool.keys()).forEach((key) => unregTimer(key));
}

/* ================= 顺序执行队列 ================= */
interface RecRunController {
  cancel: () => void;
}
// 顺序执行队列
export function recRun(
  fns: (() => void)[],
  timeout: number | number[] | ((i: number) => number),
  path: Path = ['recRun']
): RecRunController {
  let isCanceled = false;

  if (fns.length === 0)
    return {
      cancel: () => {
        isCanceled = true;
      }
    };

  validatePath(path);
  const strategy = buildStrategy(timeout);

  const executeNext = (index: number) => {
    if (isCanceled || index >= fns.length) return;
    const delay = strategy(index);
    setTimeoutWithKey(
      () => {
        if (isCanceled) return;
        fns[index]();
        executeNext(index + 1);
      },
      delay,
      path
    );
  };

  executeNext(0);

  return {
    cancel: () => {
      isCanceled = true;
      clearTimeoutWithKey(path);
    }
  };
}

// 策略构建函数保持不变
type TimeoutStrategy = (index: number) => number;

function buildStrategy(timeout: number | number[] | ((i: number) => number)): TimeoutStrategy {
  if (typeof timeout === 'number') return () => timeout;
  if (Array.isArray(timeout)) return (i) => timeout[i] ?? 0;
  if (typeof timeout === 'function') return timeout;
  throw new Error('timeout 必须是数字、数组、函数');
}

/* ================= 调试工具 ================= */
export function getPoolSize(): number {
  return pool.size;
}

export function getTrieSize(): number {
  return trie.size;
}

export function debugPrint(): void {
  console.log('Pool:', Array.from(pool.entries()));
  console.log('Trie:', Array.from(trie.entries()));
}

// timerArray.ts 末尾再加一行
export const __TEST__trieKeys = () => Array.from(trie.keys());
