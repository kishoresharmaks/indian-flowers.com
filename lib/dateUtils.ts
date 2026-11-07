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
 * Checks whether a given date string is before the minimum required delivery date.
 * Validates YYYY-MM-DD format as well as general ISO / parseable date formats.
 */
export function isBeforeMinDeliveryDate(dateStr: string, leadDays: number = MIN_DELIVERY_LEAD_DAYS): boolean {
  if (!dateStr || typeof dateStr !== 'string') return true;
  const trimmed = dateStr.trim();
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const minDateStr = getMinDeliveryDateString(leadDays);
    return trimmed < minDateStr;
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return true;
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + leadDays);
  minDate.setHours(0, 0, 0, 0);
  return parsed < minDate;
}

/**
 * Checks whether a given YYYY-MM-DD date string is before today in local time.
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const todayStr = getLocalTodayString();
  return dateStr.trim() < todayStr;
}

/**
 * Intelligent Expected Shipment Date Calculation
 * Fresh garlands and jasmine require cold-chain transport.
 * Standard FedEx Overnight dispatches 1 business day before delivery.
 * 2-Day or Cargo freight dispatches 2 business days before delivery.
 * Sunday transit hold protection bumps dispatch back to Friday.
 */
export function calculateExpectedShipmentDate(
  requestedDeliveryDateStr?: string,
  deliveryModeName?: string
): string {
  if (!requestedDeliveryDateStr || !requestedDeliveryDateStr.trim()) {
    const nextBizDay = new Date();
    nextBizDay.setDate(nextBizDay.getDate() + 1);
    if (nextBizDay.getDay() === 0) nextBizDay.setDate(nextBizDay.getDate() + 1);
    if (nextBizDay.getDay() === 6) nextBizDay.setDate(nextBizDay.getDate() + 2);
    return nextBizDay.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const deliveryDate = new Date(requestedDeliveryDateStr);
  if (isNaN(deliveryDate.getTime())) {
    return requestedDeliveryDateStr;
  }

  const modeLower = (deliveryModeName || '').toLowerCase();
  const leadDays = modeLower.includes('2-day') || modeLower.includes('cargo') ? 2 : 1;

  const shipmentDate = new Date(deliveryDate);
  shipmentDate.setDate(shipmentDate.getDate() - leadDays);

  // Cold-chain weekend hold protection:
  // Carrier transit hubs do not move priority perishables on Sunday.
  if (shipmentDate.getDay() === 0) {
    shipmentDate.setDate(shipmentDate.getDate() - 2);
  } else if (shipmentDate.getDay() === 6) {
    shipmentDate.setDate(shipmentDate.getDate() - 1);
  }

  return shipmentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
