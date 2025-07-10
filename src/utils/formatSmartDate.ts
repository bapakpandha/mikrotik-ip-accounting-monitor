export function formatSmartDate(date: Date): string {
  const now = new Date();

  const isToday =
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate();

  const pad = (n: number) => n.toString().padStart(2, "0");

  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  if (isToday) {
    return `${hours}:${minutes}:${seconds}`;
  }

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1); // Month is 0-based
  const day = pad(date.getUTCDate());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
