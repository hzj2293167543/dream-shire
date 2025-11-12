// export function parseLyric(lyric: string) {
//   const lines = lyric.split("\n");
//   const lyrics = lines.map((line) => {
//     const time = line.match(/\[\d{2}:\d{2}\.\d{3}\]/)?.[0];
//     const content = line.replace(time || "", "").trim();
//     return {
//       time: time || "",
//       content
//     };
//   });
//   return lyrics;
// }
/**
 * 格式化lyric格式为{timestamp,content}
 * @param lyric
 * @returns
 */
export function parseLyric(lyric: string) {
  const lines = lyric.split('\n').slice(0, -1);
  return lines.map((l) => {
    const times = l.match(/\d{2}:\d{2}\.\d{3}/)?.[0].split(':');
    const timestamp =
      Number(times?.[0]) * 60 +
      Number(times?.[1].split('.')[0]) +
      Number(times?.[1].split('.')[1]) / 1000;
    const content = l.match(/[\u4e00-\u9fff]+/);
    return {
      timestamp,
      content
    };
  });
}
