import {
  ReverseInputs,
  ReverseScenario,
  ScenarioSet,
} from './types';

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const percent = value * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

export function formatPercentNoSign(value: number): string {
  const percent = value * 100;
  return `${percent.toFixed(1)}%`;
}

// ============================================
// SCENARIO GENERATION
// ============================================

/**
 * Generates three distinct scenarios for the reverse calculator.
 *
 * Scenario 1 - budgetForTarget: Budget required to reach revenue target at target ROAS
 * Scenario 2 - maxRevenueGivenBudget: Max revenue given current budget at target ROAS
 * Scenario 3 - maxProfitGivenMinRevenue: Max profit given minimum acceptable revenue
 */
export function generateScenarios(
  inputs: ReverseInputs,
  targetROAS: number,
  netProfitPerOrder: number,
  contributionBeforeAds: number,
  targetImpossible: boolean,
): ScenarioSet {
  const { revenueTarget, mediaBudget, profitMarginGoal, economics } = inputs;
  const aov = economics.aov;
  const minRevenuePercent = inputs.minRevenuePercent ?? 80;

  // ========================================
  // SCENARIO 1: Budget krävd för att nå revenue target med önskad marginal
  // ========================================
  const s1Budget = isFinite(targetROAS) && targetROAS > 0
    ? revenueTarget / targetROAS
    : Infinity;
  const s1Revenue = revenueTarget;
  const s1COS = isFinite(targetROAS) ? (1 / targetROAS) * 100 : 0;
  const s1Orders = aov > 0 ? s1Revenue / aov : 0;
  const s1AdCostPerOrder = isFinite(targetROAS) && targetROAS > 0 ? aov / targetROAS : 0;
  const s1ProfitPerOrder = contributionBeforeAds - s1AdCostPerOrder;
  const s1Profit = s1Orders * s1ProfitPerOrder;

  const budgetForTarget: ReverseScenario = {
    name: 'budgetForTarget',
    label: 'Budget för mål',
    recommendedBudget: isFinite(s1Budget) ? s1Budget : mediaBudget,
    expectedRevenue: s1Revenue,
    requiredROAS: targetROAS,
    requiredCOS: s1COS,
    achievedProfitMargin: profitMarginGoal,
    budgetDelta: (isFinite(s1Budget) ? s1Budget : mediaBudget) - mediaBudget,
    budgetDeltaPercent: isFinite(s1Budget)
      ? ((s1Budget - mediaBudget) / mediaBudget) * 100
      : 0,
    revenueDelta: 0,
    revenueDeltaPercent: 0,
    profitDelta: isFinite(s1Profit) ? s1Profit : 0,
    isRecommended: true,
    reasoning: targetImpossible
      ? `Önskad marginal överstiger täckningsbidrag. Target ROAS kan inte beräknas.`
      : `Kräver budget på ${formatCurrency(isFinite(s1Budget) ? s1Budget : 0)} för att nå ${formatCurrency(revenueTarget)} med target ROAS ${targetROAS.toFixed(1)}x och marginal ${formatPercentNoSign(profitMarginGoal)}.`,
  };

  // ========================================
  // SCENARIO 2: Max revenue givet nuvarande budget och target ROAS
  // ========================================
  const s2Revenue = isFinite(targetROAS) ? mediaBudget * targetROAS : 0;
  const s2Budget = mediaBudget;
  const s2COS = isFinite(targetROAS) ? (1 / targetROAS) * 100 : 0;
  const s2Orders = aov > 0 ? s2Revenue / aov : 0;
  const s2AdCostPerOrder = isFinite(targetROAS) && targetROAS > 0 ? aov / targetROAS : 0;
  const s2ProfitPerOrder = contributionBeforeAds - s2AdCostPerOrder;
  const s2Profit = s2Orders * s2ProfitPerOrder;
  const s2RevenueDelta = s2Revenue - revenueTarget;
  const s2RevenueDeltaPercent = revenueTarget > 0 ? (s2RevenueDelta / revenueTarget) * 100 : 0;

  const maxRevenueGivenBudget: ReverseScenario = {
    name: 'maxRevenueGivenBudget',
    label: 'Max omsättning',
    recommendedBudget: s2Budget,
    expectedRevenue: s2Revenue,
    requiredROAS: targetROAS,
    requiredCOS: s2COS,
    achievedProfitMargin: profitMarginGoal,
    budgetDelta: 0,
    budgetDeltaPercent: 0,
    revenueDelta: s2RevenueDelta,
    revenueDeltaPercent: s2RevenueDeltaPercent,
    profitDelta: isFinite(s2Profit) ? s2Profit : 0,
    isRecommended: false,
    reasoning: targetImpossible
      ? `Önskad marginal överstiger täckningsbidrag. Inga lönsamma orders möjliga.`
      : `Med nuvarande budget ${formatCurrency(mediaBudget)} och target ROAS ${targetROAS.toFixed(1)}x kan max ${formatCurrency(s2Revenue)} i omsättning uppnås.`,
  };

  // ========================================
  // SCENARIO 3: Max vinst givet minsta acceptabla revenue
  // ========================================
  const s3MinRevenue = revenueTarget * (minRevenuePercent / 100);
  const s3Budget = isFinite(targetROAS) && targetROAS > 0
    ? s3MinRevenue / targetROAS
    : mediaBudget;
  const s3Revenue = s3MinRevenue;
  const s3COS = isFinite(targetROAS) ? (1 / targetROAS) * 100 : 0;
  const s3Orders = aov > 0 ? s3Revenue / aov : 0;
  const s3AdCostPerOrder = isFinite(targetROAS) && targetROAS > 0 ? aov / targetROAS : 0;
  const s3ProfitPerOrder = contributionBeforeAds - s3AdCostPerOrder;
  const s3Profit = s3Orders * s3ProfitPerOrder;
  const s3RevenueDelta = s3Revenue - revenueTarget;
  const s3RevenueDeltaPercent = revenueTarget > 0 ? (s3RevenueDelta / revenueTarget) * 100 : 0;

  const maxProfitGivenMinRevenue: ReverseScenario = {
    name: 'maxProfitGivenMinRevenue',
    label: 'Max vinst',
    recommendedBudget: isFinite(s3Budget) ? s3Budget : mediaBudget,
    expectedRevenue: s3Revenue,
    requiredROAS: targetROAS,
    requiredCOS: s3COS,
    achievedProfitMargin: profitMarginGoal,
    budgetDelta: (isFinite(s3Budget) ? s3Budget : mediaBudget) - mediaBudget,
    budgetDeltaPercent: isFinite(s3Budget)
      ? ((s3Budget - mediaBudget) / mediaBudget) * 100
      : 0,
    revenueDelta: s3RevenueDelta,
    revenueDeltaPercent: s3RevenueDeltaPercent,
    profitDelta: isFinite(s3Profit) ? s3Profit : 0,
    isRecommended: false,
    reasoning: targetImpossible
      ? `Önskad marginal överstiger täckningsbidrag.`
      : `Optimerar vinst vid ${minRevenuePercent}% av intäktsmålet (${formatCurrency(s3Revenue)}). Budget: ${formatCurrency(isFinite(s3Budget) ? s3Budget : 0)}, vinst: ${formatCurrency(isFinite(s3Profit) ? s3Profit : 0)}.`,
  };

  return {
    budgetForTarget,
    maxRevenueGivenBudget,
    maxProfitGivenMinRevenue,
  };
}

/**
 * Uppdaterar scenarion med dynamisk rekommendation baserat på status.
 *
 * - achievable → recommend budgetForTarget
 * - tight → recommend maxProfitGivenMinRevenue
 * - impossible → recommend maxRevenueGivenBudget
 */
export function updateScenarioRecommendations(
  scenarios: ScenarioSet,
  status: 'achievable' | 'tight' | 'impossible'
): ScenarioSet {
  const updated = {
    budgetForTarget: { ...scenarios.budgetForTarget },
    maxRevenueGivenBudget: { ...scenarios.maxRevenueGivenBudget },
    maxProfitGivenMinRevenue: { ...scenarios.maxProfitGivenMinRevenue },
  };

  // Reset all
  updated.budgetForTarget.isRecommended = false;
  updated.maxRevenueGivenBudget.isRecommended = false;
  updated.maxProfitGivenMinRevenue.isRecommended = false;

  switch (status) {
    case 'achievable':
      updated.budgetForTarget.isRecommended = true;
      break;
    case 'tight':
      updated.maxProfitGivenMinRevenue.isRecommended = true;
      break;
    case 'impossible':
      updated.maxRevenueGivenBudget.isRecommended = true;
      break;
  }

  return updated;
}
