/**
 * Date Utility Helpers for Storefront, Event Delivery & Checkout
 */

/**
 * Returns a date formatted as YYYY-MM-DD in local system time.
 * Reliable across Node.js SSR and browser runtimes.
 */
export function getLocalTodayString(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks whether a given YYYY-MM-DD date string is before today in local time.
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const todayStr = getLocalTodayString();
  return dateStr.trim() < todayStr;
}
