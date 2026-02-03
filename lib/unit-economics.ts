import { CalculatorInput } from './types';
import { industryDefaults } from './defaults';

// ============================================
// INTERFACES
// ============================================

export interface UnitEconomics {
  aov: number;
  productCost: number;
  productCostEffective: number;  // product_cost * (1 + return_rate)
  shippingCost: number;          // fixed SEK or AOV * shipping_rate
  paymentFee: number;            // AOV * payment_fee_rate
  contributionBeforeAds: number; // AOV - (productCostEffective + shippingCost + paymentFee)
  contributionRate: number;      // contributionBeforeAds / AOV
}

export interface RoasThresholds {
  breakEvenRoas: number;     // AOV / contributionBeforeAds
  targetRoas: number;        // AOV / (contributionBeforeAds - AOV * desiredMargin)
  breakEvenCos: number;
  targetCos: number;
  targetImpossible: boolean; // denominator <= 0
  maxAdCost: number;         // contributionBeforeAds (= break-even ad budget per order)
  maxAdCostTarget: number;   // contributionBeforeAds - AOV * desiredMargin
}

// ============================================
// COMPUTATION FUNCTIONS
// ============================================

/**
 * Computes unit economics from calculator input.
 *
 * Key formula changes from old model:
 * - Returns now INCREASE cost: productCost * (1 + returnRate)
 *   instead of reducing revenue: AOV * (1 - returnRate)
 * - contributionBeforeAds = AOV - (productCostEffective + shippingCost + paymentFee)
 */
export function computeUnitEconomics(input: CalculatorInput): UnitEconomics {
  const defaults = industryDefaults[input.industry];
  const aov = input.aov;

  // Determine product cost
  let productCost: number;
  if (input.productCost !== undefined) {
    productCost = input.productCost;
  } else if (input.grossMargin !== undefined) {
    productCost = aov * (1 - input.grossMargin / 100);
  } else {
    productCost = aov * (1 - defaults.margin);
  }

  // Return rate
  const returnRate = input.returnRate !== undefined
    ? input.returnRate / 100
    : defaults.returnRate;

  // Effective product cost: returns increase cost
  const productCostEffective = productCost * (1 + returnRate);

  // Shipping cost
  let shippingCost: number;
  if (input.shippingCostType === 'percent' && input.shippingCostPercent !== undefined) {
    shippingCost = aov * (input.shippingCostPercent / 100);
  } else if (input.shippingCost !== undefined) {
    shippingCost = input.shippingCost;
  } else {
    shippingCost = defaults.shippingCost;
  }

  // Payment fee
  const paymentFeeRate = input.paymentFee !== undefined
    ? input.paymentFee / 100
    : defaults.paymentFee;
  const paymentFee = aov * paymentFeeRate;

  // Contribution before ads
  const contributionBeforeAds = aov - (productCostEffective + shippingCost + paymentFee);
  const contributionRate = aov > 0 ? contributionBeforeAds / aov : 0;

  return {
    aov,
    productCost,
    productCostEffective,
    shippingCost,
    paymentFee,
    contributionBeforeAds,
    contributionRate,
  };
}

/**
 * Computes ROAS thresholds from unit economics.
 *
 * Key formula changes:
 * - desiredMarginOfAov means % of AOV (not % of net profit).
 *   targetRoas = effectiveAov / (contributionBeforeAds - effectiveAov * desiredMargin)
 * - LTV mode multiplies effective AOV by ltvMultiplier
 */
export function computeRoasThresholds(
  ue: UnitEconomics,
  aov: number,
  desiredMarginOfAov: number,
  ltvMultiplier?: number,
  ltvMode?: boolean,
): RoasThresholds {
  const effectiveAov = ltvMode && ltvMultiplier ? aov * ltvMultiplier : aov;

  // Break-even: effectiveAov / contributionBeforeAds
  const breakEvenRoas = ue.contributionBeforeAds > 0
    ? effectiveAov / ue.contributionBeforeAds
    : Infinity;

  // Max ad cost at target = contributionBeforeAds - effectiveAov * desiredMargin
  const maxAdCostTarget = ue.contributionBeforeAds - effectiveAov * desiredMarginOfAov;
  const targetImpossible = maxAdCostTarget <= 0;
  const targetRoas = maxAdCostTarget > 0
    ? effectiveAov / maxAdCostTarget
    : Infinity;

  // COS values
  const breakEvenCos = isFinite(breakEvenRoas) ? (1 / breakEvenRoas) * 100 : 0;
  const targetCos = isFinite(targetRoas) ? (1 / targetRoas) * 100 : 0;

  return {
    breakEvenRoas,
    targetRoas,
    breakEvenCos,
    targetCos,
    targetImpossible,
    maxAdCost: ue.contributionBeforeAds,
    maxAdCostTarget,
  };
}
