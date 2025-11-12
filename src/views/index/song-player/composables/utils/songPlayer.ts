type songData = {
  timestamp: number | undefined;
  content: string | undefined;
};
/**
 * 格式化lyric格式为{timestamp,content}
 * @param lyric
 * @returns
 */
export function parseLyric(lyric: string): songData[] {
  const lines = lyric.split('\n').slice(0, -1);
  return lines.map((l) => {
    const times = l.match(/\d{2}:\d{2}\.\d{3}/)?.[0].split(':');
    const timestamp =
      Number(times?.[0]) * 60 +
      Number(times?.[1].split('.')[0]) +
      Number(times?.[1].split('.')[1]) / 1000;
    const content = l.replace(/\[\d{2}:\d{2}\.\d{3}\]/, '');
    return {
      timestamp,
      content
    };
  });
}

/**
 * 根据当前播放时间计算播放歌词index,限制最大最小值
 * @param currentTime
 * @param songData
 * @returns
 */
export function getCurrentIndex(currentTime: number, songData: songData[]): number {
  for (let i = 0; i < songData.length; i++) {
    if (currentTime < (songData[i].timestamp ?? 0)) {
      return i - 1 > 0 ? i - 1 : 0;
    }
  }
  return songData.length - 1;
}
