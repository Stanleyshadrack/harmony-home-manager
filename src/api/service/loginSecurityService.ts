export function formatRemainingTime(ms?: number): string {
  if (typeof ms !== "number" || ms <= 0) {
    return "a moment";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
