type LyricLine = {
  timestamp: number | undefined;
  content: string | undefined;
};

/**
 * 歌词解析配置
 */
interface ParseOptions {
  /** 时间戳正则表达式 */
  timePattern?: RegExp;
  /** 是否严格模式（遇到错误行立即抛出） */
  strict?: boolean;
}

// 默认时间戳正则 [mm:ss.xxx] 或 [mm:ss.xx]
const DEFAULT_TIME_PATTERN = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

/**
 * 解析时间字符串为时间戳（秒）
 * @param timeStr 时间字符串（格式：mm:ss.xxx 或 mm:ss.xx）
 * @returns 时间戳（秒）
 */
function parseTimestamp(timeStr: string): number {
  const [minutes, seconds] = timeStr.split(':');
  const [secs, ms] = seconds.split('.');
  return Number(minutes) * 60 + Number(secs) + Number(ms) / 1000;
}

/**
 * 解析歌词行字符串为歌词行对象
 * @param line 歌词行字符串
 * @param options 解析选项
 * @returns 解析后的歌词行对象或null（如果格式无效）
 */
function parseLyricLine(line: string, options: Required<ParseOptions>): LyricLine | null {
  const match = line.match(options.timePattern);
  if (!match) {
    if (options.strict) {
      throw new Error(`Invalid lyric line format: ${line}`);
    }
    return null;
  }
  const timestamp = parseTimestamp(`${match[1]}:${match[2]}.${match[3]}`);
  const content = line.slice(match[0].length).trim();
  return { timestamp: isNaN(timestamp) ? 0 : timestamp, content: content || '' };
}

/**
 * 解析歌词字符串为歌词行数组
 * @param lyric 歌词字符串
 * @param options 解析选项
 * @returns 解析后的歌词行数组
 */
export function parseLyric(lyric: string, options: ParseOptions = {}): LyricLine[] {
  const { timePattern = DEFAULT_TIME_PATTERN, strict = false } = options;
  const lines = lyric.split('\n').slice(0, -1);
  if (!lines.length) return [];
  return lyric
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseLyricLine(line, { timePattern, strict }))
    .filter((line): line is LyricLine => line !== null)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
}

/**
 * 根据当前播放时间计算播放歌词index,限制最大最小值
 * @param currentTime 当前播放时间
 * @param lyrics 歌词行数组
 * @returns 播放歌词index
 */
export function findLyricIndex(currentTime: number, lyrics: LyricLine[]): number {
  if (!lyrics.length) return -1;
  if (currentTime < (lyrics[0].timestamp ?? 0)) return 0;

  let left = 0;
  let right = lyrics.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const currentTimestamp = lyrics[mid].timestamp ?? 0;
    const nextTimestamp = lyrics[mid + 1]?.timestamp ?? Infinity;
    if (currentTime >= currentTimestamp && currentTime < nextTimestamp) return mid;

    if (currentTime < currentTimestamp) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return lyrics.length - 1;
}
