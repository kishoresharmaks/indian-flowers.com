/**
 * Revenue & Order Payment Verification Helpers
 *
 * CRITICAL BUSINESS RULE:
 * Total Revenue MUST ONLY calculate verified payments (e.g. verified online Razorpay/Credit Card,
 * or cash/COD marked as paid and verified).
 *
 * Non-verified payments (pending verification, unverified COD, failed, cancelled, refunded)
 * MUST NEVER be counted towards total revenue or displayed as "Total Paid".
 */

export interface OrderPaymentCheckTarget {
  paymentStatus?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
  totalAmount?: number | null;
}

/**
 * Returns true if and only if the order's payment has been verified as paid
 * AND the order is not in a cancelled or failed state.
 */
export function isOrderPaymentVerified(order?: OrderPaymentCheckTarget | null): boolean {
  if (!order) return false;

  const oStatus = (order.status || '').trim().toLowerCase();
  const pStatus = (order.paymentStatus || '').trim().toLowerCase();

  // Cancelled or Failed orders never qualify as revenue
  if (oStatus === 'cancelled' || oStatus === 'failed') {
    return false;
  }

  // Failed, pending or missing payment statuses never qualify as revenue
  if (
    !pStatus ||
    pStatus === 'failed' ||
    pStatus === 'pending' ||
    pStatus === 'pending verification' ||
    pStatus === 'unpaid'
  ) {
    return false;
  }

  // Strictly verify that the payment is confirmed paid or verified
  return (
    pStatus === 'paid' ||
    pStatus === 'verified' ||
    pStatus === 'completed'
  );
}

/**
 * Computes the verified revenue across an array of orders.
 * Only orders meeting isOrderPaymentVerified are summed.
 */
export function calculateVerifiedRevenue(orders?: OrderPaymentCheckTarget[] | null): number {
  if (!Array.isArray(orders)) return 0;
  const totalCents = orders
    .filter(isOrderPaymentVerified)
    .reduce((sum, o) => {
      const amount = Number(o.totalAmount) || 0;
      return sum + Math.round(amount * 100);
    }, 0);
  return totalCents / 100;
}

export type OrderPaymentDisplayKind =
  | 'verified_paid'
  | 'pending_verification'
  | 'payment_failed'
  | 'order_cancelled'
  | 'payment_refunded'
  | 'partially_refunded';

export interface OrderPaymentDisplayInfo {
  kind: OrderPaymentDisplayKind;
  isVerified: boolean;
  isPending: boolean;
  isFailed: boolean;
  isCancelled: boolean;
  badgeLabel: string;
  badgeClass: string;
  amountLabel: string; // e.g. "Total Paid:", "Total Due:", "Total:"
  amountClass: string;
  statusDescription: string;
}

/**
 * Formats user-facing and merchant-facing payment labels for the admin order card.
 */
export function getOrderPaymentDisplayInfo(order?: OrderPaymentCheckTarget | null): OrderPaymentDisplayInfo {
  if (!order) {
    return {
      kind: 'pending_verification',
      isVerified: false,
      isPending: true,
      isFailed: false,
      isCancelled: false,
      badgeLabel: 'Pending Verification',
      badgeClass: 'bg-amber-500 text-white',
      amountLabel: 'Total Due (Pending):',
      amountClass: 'text-amber-600',
      statusDescription: 'Payment pending verification.',
    };
  }

  const oStatus = (order.status || '').trim().toLowerCase();
  const pStatus = (order.paymentStatus || '').trim().toLowerCase();

  if (oStatus === 'cancelled') {
    return {
      kind: 'order_cancelled',
      isVerified: false,
      isPending: false,
      isFailed: false,
      isCancelled: true,
      badgeLabel: 'Order Cancelled',
      badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200',
      amountLabel: 'Total (Cancelled):',
      amountClass: 'text-slate-400 line-through',
      statusDescription: 'Order was cancelled. Payment is not collected or has been voided.',
    };
  }

  if (pStatus === 'refunded' || oStatus === 'refunded' || oStatus === 'returned') {
    return {
      kind: 'payment_refunded',
      isVerified: false,
      isPending: false,
      isFailed: false,
      isCancelled: false,
      badgeLabel: 'Refunded / Returned',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
      amountLabel: 'Total Refunded:',
      amountClass: 'text-rose-600',
      statusDescription: 'Order return & refund has been processed.',
    };
  }

  if (pStatus === 'partially_refunded') {
    return {
      kind: 'partially_refunded',
      isVerified: true,
      isPending: false,
      isFailed: false,
      isCancelled: false,
      badgeLabel: 'Partially Refunded',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
      amountLabel: 'Net Paid:',
      amountClass: 'text-amber-700',
      statusDescription: 'Partial refund issued on order.',
    };
  }

  if (pStatus === 'failed' || oStatus === 'failed') {
    return {
      kind: 'payment_failed',
      isVerified: false,
      isPending: false,
      isFailed: true,
      isCancelled: false,
      badgeLabel: 'Payment Failed',
      badgeClass: 'bg-rose-500 text-white',
      amountLabel: 'Total Due (Payment Failed):',
      amountClass: 'text-rose-600',
      statusDescription: 'Payment transaction failed. Revenue is not recognized.',
    };
  }

  if (pStatus === 'paid' || pStatus === 'verified' || pStatus === 'completed') {
    return {
      kind: 'verified_paid',
      isVerified: true,
      isPending: false,
      isFailed: false,
      isCancelled: false,
      badgeLabel: 'Paid (Verified)',
      badgeClass: 'bg-emerald-500 text-white',
      amountLabel: 'Total Paid:',
      amountClass: 'text-emerald-600',
      statusDescription: 'Payment verified and confirmed.',
    };
  }

  // Default: Pending Verification (e.g. COD pending collection, unverified online order)
  return {
    kind: 'pending_verification',
    isVerified: false,
    isPending: true,
    isFailed: false,
    isCancelled: false,
    badgeLabel: 'Pending Verification',
    badgeClass: 'bg-amber-500 text-white',
    amountLabel: 'Total Due (Pending):',
    amountClass: 'text-amber-600',
    statusDescription: 'Payment pending physical collection or merchant verification.',
  };
}
