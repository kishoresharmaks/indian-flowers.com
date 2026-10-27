/**
 * Date Utility Helpers for Storefront, Event Delivery & Checkout
 */

export const MIN_DELIVERY_LEAD_DAYS = 10;

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
 * Returns the earliest selectable delivery date formatted as YYYY-MM-DD,
 * locking out the minimum lead time (defaults to 10 days).
 * Example: if today is Oct 27, 2026, min delivery date is Nov 06, 2026.
 */
export function getMinDeliveryDateString(leadDays: number = MIN_DELIVERY_LEAD_DAYS, baseDate: Date = new Date()): string {
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + leadDays);
  return getLocalTodayString(target);
}

/**
 * Formats a YYYY-MM-DD date string into human-readable US format (e.g., "Nov 6, 2026").
 */
export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return dateStr;
  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const dd = parseInt(parts[2], 10);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return dateStr;
  const d = new Date(yyyy, mm - 1, dd);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Checks whether a given YYYY-MM-DD date string is before the minimum required delivery date.
 */
export function isBeforeMinDeliveryDate(dateStr: string, leadDays: number = MIN_DELIVERY_LEAD_DAYS): boolean {
  if (!dateStr || typeof dateStr !== 'string') return true;
  const minDateStr = getMinDeliveryDateString(leadDays);
  return dateStr.trim() < minDateStr;
}

/**
 * Checks whether a given YYYY-MM-DD date string is before today in local time.
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const todayStr = getLocalTodayString();
  return dateStr.trim() < todayStr;
}
