/**
 * Volume Model: Elasticity-based revenue prediction.
 *
 * Two modes:
 * - Manual: revenue = budget * ROAS * (ROAS / roasRef)^(-elasticity)
 * - Calibrated: predicted_roas(budget) = exp(a) * budget^b (from OLS regression)
 */

// ============================================
// INTERFACES
// ============================================

export interface ManualVolumeConfig {
  elasticity: number; // 0.0 - 2.0
  roasRef: number;    // reference ROAS
}

export interface CalibratedVolumeConfig {
  a: number; // ln(roas) intercept
  b: number; // ln(roas) slope on ln(spend)
}

export type VolumeMode = 'manual' | 'calibrated';

// ============================================
// MANUAL MODE
// ============================================

/**
 * Manual revenue prediction.
 *
 * revenue = budget * ROAS * (ROAS / roasRef)^(-elasticity)
 *
 * When elasticity=0: revenue = budget * ROAS (linear, no diminishing returns)
 * When elasticity>0: higher ROAS targets produce diminishing returns
 */
export function calculateManualRevenue(
  budget: number,
  roas: number,
  config: ManualVolumeConfig
): number {
  if (budget <= 0 || roas <= 0 || config.roasRef <= 0) return 0;

  const elasticityFactor = Math.pow(roas / config.roasRef, -config.elasticity);
  return budget * roas * elasticityFactor;
}

/**
 * Manual: effective ROAS at a given budget.
 * The idea is that as you scale spend, ROAS degrades.
 *
 * effectiveRoas = roasRef * (budget / budgetRef)^(-elasticity / (1 + elasticity))
 *
 * This is derived from the manual revenue formula by solving for equilibrium.
 * Simplified: we model ROAS as decreasing with spend when elasticity > 0.
 */
export function calculateManualEffectiveRoas(
  budget: number,
  budgetRef: number,
  config: ManualVolumeConfig
): number {
  if (budget <= 0 || budgetRef <= 0 || config.roasRef <= 0) return 0;
  if (config.elasticity === 0) return config.roasRef;

  const exponent = -config.elasticity / (1 + config.elasticity);
  return config.roasRef * Math.pow(budget / budgetRef, exponent);
}

// ============================================
// CALIBRATED MODE
// ============================================

/**
 * Calibrated: predict ROAS at a given budget.
 *
 * predicted_roas = exp(a) * budget^b
 *
 * Where a and b come from OLS regression of ln(roas) on ln(spend).
 * Typically b < 0 (diminishing returns).
 */
export function predictRoas(budget: number, config: CalibratedVolumeConfig): number {
  if (budget <= 0) return 0;
  return Math.exp(config.a) * Math.pow(budget, config.b);
}

/**
 * Calibrated: predict revenue at a given budget.
 *
 * revenue = budget * predicted_roas(budget)
 */
export function predictRevenue(budget: number, config: CalibratedVolumeConfig): number {
  if (budget <= 0) return 0;
  return budget * predictRoas(budget, config);
}

/**
 * Calibrated: find optimal budget that maximizes profit.
 *
 * profit(budget) = revenue(budget) * profitMargin - budget
 *                = budget * predictRoas(budget) * profitMargin - budget
 *
 * Uses golden section search on the interval [minBudget, maxBudget].
 */
export function findOptimalBudget(
  config: CalibratedVolumeConfig,
  profitMargin: number,
  minBudget: number,
  maxBudget: number
): { budget: number; revenue: number; profit: number } {
  // Golden section search for maximum profit
  const phi = (1 + Math.sqrt(5)) / 2;
  const resphi = 2 - phi;

  let a = minBudget;
  let b = maxBudget;
  let x1 = a + resphi * (b - a);
  let x2 = b - resphi * (b - a);

  const profitFn = (budget: number) => {
    const rev = predictRevenue(budget, config);
    return rev * profitMargin - budget;
  };

  let f1 = profitFn(x1);
  let f2 = profitFn(x2);

  const tolerance = 100; // SEK precision
  const maxIter = 100;

  for (let i = 0; i < maxIter && (b - a) > tolerance; i++) {
    if (f1 < f2) {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = b - resphi * (b - a);
      f2 = profitFn(x2);
    } else {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = a + resphi * (b - a);
      f1 = profitFn(x1);
    }
  }

  const optimalBudget = (a + b) / 2;
  const optimalRevenue = predictRevenue(optimalBudget, config);
  const optimalProfit = optimalRevenue * profitMargin - optimalBudget;

  return {
    budget: optimalBudget,
    revenue: optimalRevenue,
    profit: optimalProfit,
  };
}
