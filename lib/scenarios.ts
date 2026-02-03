import {
  ReverseInputs,
  ReverseScenario,
  ScenarioSet,
} from './types';
// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formaterar ett belopp i svensk valuta.
 * @param amount - Belopp i SEK
 * @returns Formaterad sträng med SEK, inga decimaler
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formaterar ett procentvärde med tecken.
 * @param value - Värde som decimal (t.ex. 0.25 för 25%)
 * @returns Formaterad sträng med +/- tecken, en decimal, %
 */
export function formatPercent(value: number): string {
  const percent = value * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Formaterar ett procentvärde utan tecken.
 * @param value - Värde som decimal (t.ex. 0.25 för 25%)
 * @returns Formaterad sträng med en decimal, %
 */
export function formatPercentNoSign(value: number): string {
  const percent = value * 100;
  return `${percent.toFixed(1)}%`;
}

// ============================================
// SCENARIO GENERATION
// ============================================

/**
 * Beräknar target ROAS för en given vinstmarginal.
 * targetROAS = AOV / (netProfitPerOrder × (1 - profitMargin))
 */
function calculateTargetRoasForMargin(
  aov: number,
  netProfitPerOrder: number,
  profitMargin: number
): number {
  if (netProfitPerOrder <= 0) return Infinity;
  const profitRetention = 1 - profitMargin;
  if (profitRetention <= 0) return Infinity;
  return aov / (netProfitPerOrder * profitRetention);
}

/**
 * Genererar tre scenarion för bakåt-kalkylatorn.
 *
 * Scenarion:
 * - balance: Rekommenderat - Optimal balans mellan omsättning och vinst
 * - maxRevenue: Högsta möjliga omsättning med bibehållen vinstmarginal
 * - maxProfit: Högsta vinstmarginal genom reducerad budget
 *
 * @param inputs - Användarens indata med affärsmål och ekonomiska parametrar
 * @param targetROAS - Target ROAS från framåt-beräkning
 * @param netProfitPerOrder - Nettovinst per order
 * @returns ScenarioSet med tre scenarion
 */
export function generateScenarios(
  inputs: ReverseInputs,
  targetROAS: number,
  netProfitPerOrder: number
): ScenarioSet {
  const { revenueTarget, mediaBudget, profitMarginGoal, economics } = inputs;
  const aov = economics.aov;

  // ========================================
  // BALANCE SCENARIO (Rekommenderat)
  // ========================================
  // Optimal balans: Når både omsättningsmål och önskad vinstmarginal
  // genom att justera budget till target ROAS

  const balanceBudget = revenueTarget / targetROAS;
  const balanceRevenue = revenueTarget;
  const balanceCOS = isFinite(targetROAS) ? (1 / targetROAS) * 100 : 0;

  const balance: ReverseScenario = {
    name: 'balance',
    label: 'Balanserad',
    recommendedBudget: balanceBudget,
    expectedRevenue: balanceRevenue,
    requiredROAS: targetROAS,
    requiredCOS: balanceCOS,
    achievedProfitMargin: profitMarginGoal,
    budgetDelta: balanceBudget - mediaBudget,
    budgetDeltaPercent: ((balanceBudget - mediaBudget) / mediaBudget) * 100,
    revenueDelta: 0,
    revenueDeltaPercent: 0,
    profitDelta: calculateProfitDelta(balanceRevenue, aov, netProfitPerOrder, profitMarginGoal),
    isRecommended: true,
    reasoning: `Optimal balans mellan omsättning och vinst med target ROAS ${targetROAS.toFixed(1)}x. Uppnår både omsättningsmål och önskad vinstmarginal på ${formatPercentNoSign(profitMarginGoal)}.`,
  };

  // ========================================
  // MAX REVENUE SCENARIO
  // ========================================
  // Högsta möjliga omsättning med bibehållen vinstmarginal
  // Kräver potentiellt högre budget

  const maxRevenueBudget = revenueTarget / targetROAS;
  const maxRevenueRevenue = revenueTarget;
  const maxRevenueCOS = isFinite(targetROAS) ? (1 / targetROAS) * 100 : 0;
  const maxRevenueBudgetDeltaPercent = ((maxRevenueBudget - mediaBudget) / mediaBudget) * 100;

  const maxRevenue: ReverseScenario = {
    name: 'maxRevenue',
    label: 'Maximera omsättning',
    recommendedBudget: maxRevenueBudget,
    expectedRevenue: maxRevenueRevenue,
    requiredROAS: targetROAS,
    requiredCOS: maxRevenueCOS,
    achievedProfitMargin: profitMarginGoal,
    budgetDelta: maxRevenueBudget - mediaBudget,
    budgetDeltaPercent: maxRevenueBudgetDeltaPercent,
    revenueDelta: 0,
    revenueDeltaPercent: 0,
    profitDelta: calculateProfitDelta(maxRevenueRevenue, aov, netProfitPerOrder, profitMarginGoal),
    isRecommended: false,
    reasoning: `Högsta möjliga omsättning (${formatCurrency(maxRevenueRevenue)}) med bibehållen vinstmarginal på ${formatPercentNoSign(profitMarginGoal)}. Kräver ${maxRevenueBudgetDeltaPercent >= 0 ? 'ökning' : 'minskning'} av mediabudget med ${formatPercent(Math.abs(maxRevenueBudgetDeltaPercent) / 100)}.`,
  };

  // ========================================
  // MAX PROFIT SCENARIO
  // ========================================
  // Högsta vinstmarginal (25% högre än mål) genom reducerad budget
  // Accepterar lägre omsättning för högre marginal

  const maxProfitTargetMargin = Math.min(profitMarginGoal * 1.25, 0.90); // Cap at 90%
  const maxProfitROAS = calculateTargetRoasForMargin(aov, netProfitPerOrder, maxProfitTargetMargin);
  const maxProfitBudget = revenueTarget / maxProfitROAS;
  const maxProfitRevenue = maxProfitBudget * maxProfitROAS;
  const maxProfitCOS = isFinite(maxProfitROAS) ? (1 / maxProfitROAS) * 100 : 0;
  const maxProfitRevenueDeltaPercent = ((maxProfitRevenue - revenueTarget) / revenueTarget) * 100;

  const maxProfit: ReverseScenario = {
    name: 'maxProfit',
    label: 'Maximera vinst',
    recommendedBudget: maxProfitBudget,
    expectedRevenue: maxProfitRevenue,
    requiredROAS: maxProfitROAS,
    requiredCOS: maxProfitCOS,
    achievedProfitMargin: maxProfitTargetMargin,
    budgetDelta: maxProfitBudget - mediaBudget,
    budgetDeltaPercent: ((maxProfitBudget - mediaBudget) / mediaBudget) * 100,
    revenueDelta: maxProfitRevenue - revenueTarget,
    revenueDeltaPercent: maxProfitRevenueDeltaPercent,
    profitDelta: calculateProfitDelta(maxProfitRevenue, aov, netProfitPerOrder, maxProfitTargetMargin),
    isRecommended: false,
    reasoning: `Högsta vinstmarginal (${formatPercentNoSign(maxProfitTargetMargin)}) genom reducerad mediabudget. Omsättning blir ${Math.abs(maxProfitRevenueDeltaPercent).toFixed(0)}% ${maxProfitRevenueDeltaPercent < 0 ? 'lägre' : 'högre'} än målsättning.`,
  };

  return {
    balance,
    maxRevenue,
    maxProfit,
  };
}

/**
 * Beräknar vinst (profit delta) för ett scenario.
 * profit = (revenue / aov) × netProfitPerOrder × profitMargin
 */
function calculateProfitDelta(
  revenue: number,
  aov: number,
  netProfitPerOrder: number,
  profitMargin: number
): number {
  const orders = revenue / aov;
  return orders * netProfitPerOrder * profitMargin;
}

/**
 * Uppdaterar scenarion med dynamisk rekommendation baserat på status.
 *
 * @param scenarios - Ursprungliga scenarion
 * @param status - Aktuell målstatus
 * @returns Uppdaterade scenarion med rätt rekommendation
 */
export function updateScenarioRecommendations(
  scenarios: ScenarioSet,
  status: 'achievable' | 'tight' | 'impossible'
): ScenarioSet {
  // Skapa kopior för att inte mutera original
  const updated = {
    balance: { ...scenarios.balance },
    maxRevenue: { ...scenarios.maxRevenue },
    maxProfit: { ...scenarios.maxProfit },
  };

  // Återställ alla till false
  updated.balance.isRecommended = false;
  updated.maxRevenue.isRecommended = false;
  updated.maxProfit.isRecommended = false;

  // Sätt rekommendation baserat på status
  switch (status) {
    case 'achievable':
      // Om målet är uppnåeligt, rekommendera balanserad (optimal approach)
      updated.balance.isRecommended = true;
      break;
    case 'tight':
      // Om det är tight, rekommendera max profit för att säkra marginalen
      updated.maxProfit.isRecommended = true;
      break;
    case 'impossible':
      // Om omöjligt, rekommendera max revenue för att komma närmast målet
      updated.maxRevenue.isRecommended = true;
      break;
  }

  return updated;
}
