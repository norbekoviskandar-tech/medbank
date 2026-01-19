// Helper utilities
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

export function capitalizeString(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncateString(str, length) {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
