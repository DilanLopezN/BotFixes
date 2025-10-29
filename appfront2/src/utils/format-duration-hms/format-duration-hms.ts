export const formatDurationHms = (totalSeconds?: number) => {
  if (!totalSeconds) return '';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = hours > 0 ? `${hours}h` : '';
  const mStr = minutes > 0 ? `${minutes}min` : '';
  const sStr = seconds > 0 ? `${seconds}seg` : '';

  return `${hStr} ${mStr} ${sStr}`.trim();
};
