const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );

  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value.toString() : value.toFixed(1)} ${UNITS[i]}`;
}
