export function formatSmartDate(date: Date): string {
    const now = new Date();
  
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  
    const pad = (n: number) => n.toString().padStart(2, "0");
  
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
  
    if (isToday) {
      return `${hours}:${minutes}:${seconds}`;
    }
  
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Month is 0-based
    const day = pad(date.getDate());
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  