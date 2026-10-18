import Settings from '@/models/Settings';
import Customer from '@/models/Customer';
import Order from '@/models/Order';

export interface LoyaltyConfig {
  enabled: boolean;
  spendAmount: number; // e.g. 100 ($100 spent)
  pointsEarned: number; // e.g. 10 (10 points earned)
  redemptionEnabled: boolean; // whether customers can claim/convert points
  pointsPerDollar: number; // e.g. 10 (10 points = $1.00 USD discount)
  minPointsToRedeem: number; // e.g. 10 points minimum to claim
  maxRedemptionPercent: number; // e.g. 50 (max 50% of subtotal can be paid with points)
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  spendAmount: 100,
  pointsEarned: 10,
  redemptionEnabled: true,
  pointsPerDollar: 10, // 10 points = $1.00 (1 pt = $0.10)
  minPointsToRedeem: 10,
  maxRedemptionPercent: 100, // up to 100% of order subtotal
};

/**
 * Resolves active loyalty config from store settings object or database
 */
export async function getLoyaltyConfig(settingsObj?: any): Promise<LoyaltyConfig> {
  if (settingsObj) {
    return {
      enabled: settingsObj.loyaltyEnabled !== false,
      spendAmount: Number(settingsObj.loyaltySpendAmount) > 0 ? Number(settingsObj.loyaltySpendAmount) : 100,
      pointsEarned: Number(settingsObj.loyaltyPointsEarned) > 0 ? Number(settingsObj.loyaltyPointsEarned) : 10,
      redemptionEnabled: settingsObj.loyaltyRedemptionEnabled !== false,
      pointsPerDollar: Number(settingsObj.loyaltyPointsPerDollar) > 0 ? Number(settingsObj.loyaltyPointsPerDollar) : 10,
      minPointsToRedeem: Number(settingsObj.loyaltyMinPointsToRedeem) >= 0 ? Number(settingsObj.loyaltyMinPointsToRedeem) : 10,
      maxRedemptionPercent: Number(settingsObj.loyaltyMaxRedemptionPercent) > 0 ? Number(settingsObj.loyaltyMaxRedemptionPercent) : 100,
    };
  }

  try {
    const settings = await Settings.findOne({ key: 'global' }).lean();
    if (!settings) return DEFAULT_LOYALTY_CONFIG;
    return {
      enabled: settings.loyaltyEnabled !== false,
      spendAmount: Number(settings.loyaltySpendAmount) > 0 ? Number(settings.loyaltySpendAmount) : 100,
      pointsEarned: Number(settings.loyaltyPointsEarned) > 0 ? Number(settings.loyaltyPointsEarned) : 10,
      redemptionEnabled: settings.loyaltyRedemptionEnabled !== false,
      pointsPerDollar: Number(settings.loyaltyPointsPerDollar) > 0 ? Number(settings.loyaltyPointsPerDollar) : 10,
      minPointsToRedeem: Number(settings.loyaltyMinPointsToRedeem) >= 0 ? Number(settings.loyaltyMinPointsToRedeem) : 10,
      maxRedemptionPercent: Number(settings.loyaltyMaxRedemptionPercent) > 0 ? Number(settings.loyaltyMaxRedemptionPercent) : 100,
    };
  } catch (err) {
    console.error('Error fetching loyalty config from DB:', err);
    return DEFAULT_LOYALTY_CONFIG;
  }
}

/**
 * Calculate points earned based on net spend (in USD) and loyalty config
 * Example: $100 spent = 10 points. If spend is $250, points = 25.
 */
export function calculatePointsEarned(spendAmountUSD: number, config: LoyaltyConfig): number {
  if (!config.enabled || spendAmountUSD <= 0) return 0;
  if (config.spendAmount <= 0 || config.pointsEarned <= 0) return 0;

  // Rate = pointsEarned / spendAmount
  const rate = config.pointsEarned / config.spendAmount;
  // Award whole points based on net spend
  return Math.floor(spendAmountUSD * rate);
}

/**
 * Calculate discount amount (in USD) when redeeming points
 * Example: 10 points = $1.00 USD. If redeeming 50 points, discount = $5.00.
 */
export function calculatePointsDiscount(
  pointsToRedeem: number,
  orderSubtotalUSD: number,
  config: LoyaltyConfig
): { pointsUsed: number; discountAmount: number; isValid: boolean; message?: string } {
  if (!config.enabled || !config.redemptionEnabled) {
    return { pointsUsed: 0, discountAmount: 0, isValid: false, message: 'Points redemption is currently disabled.' };
  }

  const cleanPoints = Math.max(0, Math.floor(Number(pointsToRedeem) || 0));
  if (cleanPoints <= 0) {
    return { pointsUsed: 0, discountAmount: 0, isValid: true };
  }

  if (cleanPoints < config.minPointsToRedeem) {
    return {
      pointsUsed: 0,
      discountAmount: 0,
      isValid: false,
      message: `Minimum ${config.minPointsToRedeem} points required to redeem rewards.`,
    };
  }

  // Calculate gross discount in USD
  const rate = config.pointsPerDollar > 0 ? config.pointsPerDollar : 10;
  const rawDiscount = cleanPoints / rate;

  // Max discount cap based on order subtotal and maxRedemptionPercent
  const maxAllowedDiscount = (orderSubtotalUSD * config.maxRedemptionPercent) / 100;
  const safeDiscount = Math.min(rawDiscount, maxAllowedDiscount, orderSubtotalUSD);
  const roundedDiscount = Math.round(safeDiscount * 100) / 100;

  // Recalculate actual points used to cover this rounded discount
  const actualPointsUsed = Math.min(cleanPoints, Math.ceil(roundedDiscount * rate));

  return {
    pointsUsed: actualPointsUsed,
    discountAmount: roundedDiscount,
    isValid: true,
  };
}

/**
 * Credit earned points to customer account and record in ledger
 */
export async function creditOrderPoints(
  customerId: string,
  orderId: string,
  spendAmountUSD: number,
  config?: LoyaltyConfig
): Promise<number> {
  if (!customerId) return 0;

  try {
    const activeConfig = config || (await getLoyaltyConfig());
    if (!activeConfig.enabled) return 0;

    const pointsToAward = calculatePointsEarned(spendAmountUSD, activeConfig);
    if (pointsToAward <= 0) return 0;

    const customer = await Customer.findById(customerId);
    if (!customer) return 0;

    const currentBalance = customer.pointsBalance || 0;
    const newBalance = currentBalance + pointsToAward;

    const ledgerEntry = {
      date: new Date(),
      type: 'EARNED',
      points: pointsToAward,
      balanceAfter: newBalance,
      orderId,
      reason: `Reward points earned for order ${orderId} ($${spendAmountUSD.toFixed(2)} spent)`,
      dollarEquivalent: Math.round((pointsToAward / activeConfig.pointsPerDollar) * 100) / 100,
    };

    customer.pointsBalance = newBalance;
    customer.totalPointsEarned = (customer.totalPointsEarned || 0) + pointsToAward;
    if (!Array.isArray(customer.pointsHistory)) {
      customer.pointsHistory = [];
    }
    customer.pointsHistory.unshift(ledgerEntry as any);

    await customer.save();

    // Mark order as points awarded
    await Order.findOneAndUpdate({ orderId }, { $set: { pointsEarned: pointsToAward, pointsAwarded: true } });

    return pointsToAward;
  } catch (err) {
    console.error(`Failed to credit loyalty points for order ${orderId}:`, err);
    return 0;
  }
}

/**
 * Debit redeemed points from customer account on order placement
 */
export async function debitOrderPoints(
  customerId: string,
  orderId: string,
  pointsToRedeem: number,
  discountUSD: number
): Promise<boolean> {
  if (!customerId || pointsToRedeem <= 0) return false;

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return false;

    const currentBalance = customer.pointsBalance || 0;
    if (currentBalance < pointsToRedeem) {
      console.warn(`Customer ${customerId} only has ${currentBalance} points, cannot redeem ${pointsToRedeem}`);
      return false;
    }

    const newBalance = currentBalance - pointsToRedeem;

    const ledgerEntry = {
      date: new Date(),
      type: 'REDEEMED',
      points: -pointsToRedeem,
      balanceAfter: newBalance,
      orderId,
      reason: `Claimed ${pointsToRedeem} points for $${discountUSD.toFixed(2)} discount on order ${orderId}`,
      dollarEquivalent: discountUSD,
    };

    customer.pointsBalance = newBalance;
    customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + pointsToRedeem;
    if (!Array.isArray(customer.pointsHistory)) {
      customer.pointsHistory = [];
    }
    customer.pointsHistory.unshift(ledgerEntry as any);

    await customer.save();
    return true;
  } catch (err) {
    console.error(`Failed to debit loyalty points for order ${orderId}:`, err);
    return false;
  }
}

/**
 * Reverses points upon order return / refund:
 * 1. Reverses points awarded from the order (deducts from customer balance).
 * 2. Restores points redeemed on the order back to customer balance.
 */
export async function reversePointsOnRefund(
  order: any,
  refundAmountUSD: number
): Promise<{ pointsDeducted: number; pointsRestored: number }> {
  if (!order || !order.customerId) {
    return { pointsDeducted: 0, pointsRestored: 0 };
  }

  let pointsDeducted = 0;
  let pointsRestored = 0;

  try {
    const customer = await Customer.findById(order.customerId);
    if (!customer) return { pointsDeducted: 0, pointsRestored: 0 };

    const orderTotal = Number(order.totalAmount) || 1;
    const isFullRefund = refundAmountUSD >= orderTotal;
    const refundRatio = Math.min(1, Math.max(0, refundAmountUSD / orderTotal));

    // 1. Reverse Points Earned if previously awarded
    if (order.pointsAwarded && Number(order.pointsEarned) > 0) {
      const earned = Number(order.pointsEarned);
      const pointsToReverse = isFullRefund ? earned : Math.round(earned * refundRatio);

      if (pointsToReverse > 0) {
        const currentBalance = customer.pointsBalance || 0;
        const newBalance = Math.max(0, currentBalance - pointsToReverse);

        customer.pointsBalance = newBalance;
        customer.totalPointsEarned = Math.max(0, (customer.totalPointsEarned || 0) - pointsToReverse);

        const deductEntry = {
          date: new Date(),
          type: 'REFUND_DEDUCTED',
          points: -pointsToReverse,
          balanceAfter: newBalance,
          orderId: order.orderId,
          reason: `Points reversed due to return/refund on order ${order.orderId} (-$${refundAmountUSD.toFixed(2)})`,
        };

        if (!Array.isArray(customer.pointsHistory)) customer.pointsHistory = [];
        customer.pointsHistory.unshift(deductEntry as any);
        pointsDeducted = pointsToReverse;
      }
    }

    // 2. Restore Points Redeemed back to customer
    if (Number(order.pointsRedeemed) > 0) {
      const redeemed = Number(order.pointsRedeemed);
      const pointsToRestore = isFullRefund ? redeemed : Math.round(redeemed * refundRatio);

      if (pointsToRestore > 0) {
        const currentBalance = customer.pointsBalance || 0;
        const newBalance = currentBalance + pointsToRestore;

        customer.pointsBalance = newBalance;
        customer.totalPointsRedeemed = Math.max(0, (customer.totalPointsRedeemed || 0) - pointsToRestore);

        const restoreEntry = {
          date: new Date(),
          type: 'REFUND_RESTORED',
          points: pointsToRestore,
          balanceAfter: newBalance,
          orderId: order.orderId,
          reason: `Restored ${pointsToRestore} redeemed reward points due to return/refund on order ${order.orderId}`,
        };

        if (!Array.isArray(customer.pointsHistory)) customer.pointsHistory = [];
        customer.pointsHistory.unshift(restoreEntry as any);
        pointsRestored = pointsToRestore;
      }
    }

    await customer.save();
  } catch (err) {
    console.error(`Failed to reverse loyalty points on refund for order ${order.orderId}:`, err);
  }

  return { pointsDeducted, pointsRestored };
}

/**
 * Admin manual adjustment of customer points balance with audit note
 */
export async function manualAdjustCustomerPoints(
  customerId: string,
  pointsAdjustment: number,
  reason: string,
  adminUsername?: string
): Promise<{ success: boolean; newBalance: number; message: string }> {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return { success: false, newBalance: 0, message: 'Customer not found' };
    }

    const currentBalance = customer.pointsBalance || 0;
    const newBalance = Math.max(0, currentBalance + pointsAdjustment);

    const ledgerEntry = {
      date: new Date(),
      type: 'ADJUSTED',
      points: pointsAdjustment,
      balanceAfter: newBalance,
      reason: `${reason || 'Admin manual balance adjustment'} (by ${adminUsername || 'Admin'})`,
    };

    customer.pointsBalance = newBalance;
    if (pointsAdjustment > 0) {
      customer.totalPointsEarned = (customer.totalPointsEarned || 0) + pointsAdjustment;
    }
    if (!Array.isArray(customer.pointsHistory)) customer.pointsHistory = [];
    customer.pointsHistory.unshift(ledgerEntry as any);

    await customer.save();
    return { success: true, newBalance, message: 'Customer points balance updated successfully.' };
  } catch (err: any) {
    return { success: false, newBalance: 0, message: err.message || 'Failed to adjust customer points' };
  }
}
