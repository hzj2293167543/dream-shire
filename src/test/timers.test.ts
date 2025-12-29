import * as timer from '../utils/timers';

beforeEach(() => timer.clearTimeoutAll());

/* ---------------- 路径校验 ---------------- */
describe('路径校验', () => {
  test.each([
    { desc: '空路径', path: [] },
    { desc: '含分隔符', path: ['a\x1Fb'] }
  ])('$desc 应抛错', ({ path }) => {
    expect(() => timer.setTimeoutWithKey(() => {}, 0, path as any)).toThrow();
  });
});

/* ---------------- 单点注册 / 取消 ---------------- */
describe('setTimeoutWithKey & clearTimeoutWithKey', () => {
  jest.useFakeTimers();
  afterEach(() => jest.clearAllTimers());

  it('注册后池子+1，trie 节点正确', () => {
    timer.setTimeoutWithKey(() => {}, 100, ['foo']);
    expect(timer.getPoolSize()).toBe(1);
    expect(timer.getTrieSize()).toBe(1);
  });

  it('取消后池子-1，trie 清空', () => {
    timer.setTimeoutWithKey(() => {}, 100, ['foo']);
    timer.clearTimeoutWithKey(['foo']);
    expect(timer.getPoolSize()).toBe(0);
    expect(timer.getTrieSize()).toBe(0);
  });

  it('回调真正执行', () => {
    const fn = jest.fn();
    timer.setTimeoutWithKey(fn, 100, ['a']);
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('取消后回调不再执行', () => {
    const fn = jest.fn();
    timer.setTimeoutWithKey(fn, 100, ['a']);
    timer.clearTimeoutWithKey(['a']);
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

/* ---------------- 递归删除子树 ---------------- */
describe('clearTimeoutWithKey 递归删除子树', () => {
  jest.useFakeTimers();
  afterEach(() => jest.clearAllTimers());

  it('删除节点及其所有后代，兄弟保留', () => {
    const fn1 = jest.fn(),
      fn2 = jest.fn(),
      fn3 = jest.fn();
    timer.setTimeoutWithKey(fn1, 100, ['a', 'b']);
    timer.setTimeoutWithKey(fn2, 100, ['a', 'b', 'c']);
    timer.setTimeoutWithKey(fn3, 100, ['a', 'x']); // 兄弟

    timer.clearTimeoutWithKey(['a', 'b']);

    jest.advanceTimersByTime(100);
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
    expect(fn3).toHaveBeenCalled();
    expect(timer.getPoolSize()).toBe(1);
  });

  it('删除后只保留兄弟分支的前缀', () => {
    timer.setTimeoutWithKey(() => {}, 100, ['x', 'y', 'z']);
    timer.setTimeoutWithKey(() => {}, 100, ['x', 'y', 'w']);
    timer.setTimeoutWithKey(() => {}, 100, ['x', 'm']);

    timer.clearTimeoutWithKey(['x', 'y']);

    expect(timer.getPoolSize()).toBe(1);
    expect(timer.__TEST__trieKeys()).toEqual(['x', 'x\x1Fm']);
  });
});

/* ---------------- 顺序队列 recSetTimeout ---------------- */
describe('recSetTimeout', () => {
  jest.useFakeTimers();
  afterEach(() => jest.clearAllTimers());

  it('空数组立即返回 cancel', () => {
    const ctrl = timer.recSetTimeout([], 100);
    expect(typeof ctrl.cancel).toBe('function');
  });

  it('顺序执行 + 中途取消', () => {
    const calls: number[] = [];
    const ctrl = timer.recSetTimeout(
      [0, 1, 2].map((i) => () => calls.push(i)),
      10
    );
    jest.advanceTimersByTime(15);
    expect(calls).toEqual([0]);
    jest.advanceTimersByTime(10);
    expect(calls).toEqual([0, 1]);
    ctrl.cancel();
    jest.advanceTimersByTime(20);
    expect(calls).toEqual([0, 1]);
  });

  it('数组间隔策略', () => {
    const calls: number[] = [];
    timer.recSetTimeout(
      [0, 1, 2].map((i) => () => calls.push(i)),
      [20, 30, 40]
    );
    jest.advanceTimersByTime(20);
    expect(calls).toEqual([0]);
    jest.advanceTimersByTime(30);
    expect(calls).toEqual([0, 1]);
  });

  it('函数策略', () => {
    const calls: number[] = [];
    timer.recSetTimeout(
      [0, 1].map((i) => () => calls.push(i)),
      (i) => (i + 1) * 10
    );
    jest.advanceTimersByTime(10);
    expect(calls).toEqual([0]);
    jest.advanceTimersByTime(20);
    expect(calls).toEqual([0, 1]);
  });

  it('非法策略抛错', () => {
    expect(() => timer.recSetTimeout([() => {}], {} as any)).toThrow(
      /timeout 必须是数字、数组、函数/
    );
  });

  it('延迟为 0 仍顺序执行', () => {
    const calls: number[] = [];
    timer.recSetTimeout([() => calls.push(1), () => calls.push(2)], 0);
    jest.runAllTimers();
    expect(calls).toEqual([1, 2]);
  });
});

/* ---------------- 工具函数 ---------------- */
describe('工具函数', () => {
  it('clearTimeoutAll 清空全部', () => {
    timer.setTimeoutWithKey(() => {}, 10, ['a']);
    timer.setTimeoutWithKey(() => {}, 10, ['b']);
    expect(timer.getPoolSize()).toBe(2);
    timer.clearTimeoutAll();
    expect(timer.getPoolSize()).toBe(0);
    expect(timer.getTrieSize()).toBe(0);
  });

  it('debugPrint 不抛错', () => {
    timer.setTimeoutWithKey(() => {}, 10, ['a']);
    expect(() => timer.debugPrint()).not.toThrow();
  });
});

/* ---------------- 边角补齐 ---------------- */
describe('边角补齐', () => {
  jest.useFakeTimers();
  afterEach(() => jest.clearAllTimers());

  it('同 key 多次注册，回调都执行', () => {
    const fn1 = jest.fn(),
      fn2 = jest.fn();
    timer.setTimeoutWithKey(fn1, 100, ['dup']);
    timer.setTimeoutWithKey(fn2, 100, ['dup']);
    jest.advanceTimersByTime(100);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('取消不存在的路径不抛错', () => {
    expect(() => timer.clearTimeoutWithKey(['ghost'])).not.toThrow();
  });

  it('删除中间节点（自身无定时器）仍清掉子树', () => {
    const fn = jest.fn();
    timer.setTimeoutWithKey(fn, 100, ['a', 'b', 'c']);
    // ['a','b'] 本身没有定时器
    timer.clearTimeoutWithKey(['a', 'b']);
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    expect(timer.getPoolSize()).toBe(0);
  });

  it('百万级路径压力测试（跳过 CI）', () => {
    const cnt = 100_000; // 本地 10w 快速通过，CI 可再降
    for (let i = 0; i < cnt; i++) {
      timer.setTimeoutWithKey(() => {}, 1, ['p', `${i}`]);
    }
    expect(timer.getPoolSize()).toBe(cnt);
    timer.clearTimeoutWithKey(['p']);
    expect(timer.getPoolSize()).toBe(0);
    expect(timer.getTrieSize()).toBe(0);
  });
});
