// google 20c colors
export const COLOR_LIST = ["#3366cc", "#dc3912", "#ff9900", "#109618",
  "#990099", "#0099c6", "#dd4477", "#66aa00",
  "#b82e2e", "#316395", "#994499", "#22aa99",
  "#aaaa11", "#6633cc", "#e67300", "#8b0707",
  "#651067", "#329262", "#5574a6", "#3b3eac"];

export function getColor(index: number) {
  let color = '#000000';
  if (index < COLOR_LIST.length)
    color = COLOR_LIST[index];

  return color;
}

