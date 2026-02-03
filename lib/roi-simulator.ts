import {
  ReverseInputs,
  ReverseScenario,
  ROICase,
  ROISimulationConfig,
  ROISimulation,
  MonthlyProjection,
} from './types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec',
];

/**
 * Returns default simulation config for a given ROI case.
 */
export function getDefaultConfig(roiCase: ROICase): ROISimulationConfig {
  switch (roiCase) {
    case 'worst':
      return { case: 'worst', rampUpMonths: 4, variancePercent: -20 };
    case 'expected':
      return { case: 'expected', rampUpMonths: 3, variancePercent: 0 };
    case 'best':
      return { case: 'best', rampUpMonths: 2, variancePercent: 15 };
  }
}

/**
 * Simulates 12-month ROI projections comparing "if we act" vs "if we wait".
 *
 * ifWeDo: Ad spend ramps up over rampUpMonths, ROAS improves toward target.
 * ifWeWait: Baseline with zero ad spend growth (flat revenue from organic).
 */
export function simulateROI(
  inputs: ReverseInputs,
  scenario: ReverseScenario,
  config: ROISimulationConfig
): ROISimulation {
  const months = 12;
  const monthlyBudget = scenario.recommendedBudget / months;
  const targetROAS = scenario.requiredROAS;
  const varianceMultiplier = 1 + (config.variancePercent / 100);

  // Adjusted ROAS with variance
  const adjustedROAS = targetROAS * varianceMultiplier;

  // Baseline organic revenue (10% of revenue target spread monthly, no ad spend)
  const baselineMonthlyRevenue = (inputs.revenueTarget * 0.1) / months;

  const ifWeDo: MonthlyProjection[] = [];
  const ifWeWait: MonthlyProjection[] = [];

  let cumulativeProfitDo = 0;
  let cumulativeRevenueDo = 0;
  let cumulativeProfitWait = 0;
  let cumulativeRevenueWait = 0;
  let breakEvenMonth = -1;

  for (let m = 0; m < months; m++) {
    // Ramp-up factor: linearly increases from 0.3 to 1.0 over rampUpMonths
    const rampFactor = m < config.rampUpMonths
      ? 0.3 + (0.7 * (m / config.rampUpMonths))
      : 1.0;

    // "If we do" scenario
    const currentBudget = monthlyBudget * rampFactor;
    const currentROAS = adjustedROAS * rampFactor;
    const adRevenue = currentBudget * currentROAS;
    const totalRevenue = adRevenue + baselineMonthlyRevenue;
    const profitMargin = scenario.achievedProfitMargin;
    const grossProfit = adRevenue * profitMargin;
    const monthlyProfit = grossProfit - currentBudget;

    cumulativeProfitDo += monthlyProfit;
    cumulativeRevenueDo += totalRevenue;

    ifWeDo.push({
      month: m + 1,
      label: MONTH_LABELS[m],
      revenue: totalRevenue,
      adSpend: currentBudget,
      profit: monthlyProfit,
      cumulativeProfit: cumulativeProfitDo,
      cumulativeRevenue: cumulativeRevenueDo,
    });

    // "If we wait" scenario - just organic baseline
    const waitRevenue = baselineMonthlyRevenue;
    const waitProfit = waitRevenue * profitMargin;

    cumulativeProfitWait += waitProfit;
    cumulativeRevenueWait += waitRevenue;

    ifWeWait.push({
      month: m + 1,
      label: MONTH_LABELS[m],
      revenue: waitRevenue,
      adSpend: 0,
      profit: waitProfit,
      cumulativeProfit: cumulativeProfitWait,
      cumulativeRevenue: cumulativeRevenueWait,
    });

    // Detect break-even month (first month where cumulative profit > 0)
    if (breakEvenMonth === -1 && cumulativeProfitDo > 0) {
      breakEvenMonth = m + 1;
    }
  }

  const totalRevenueDelta = cumulativeRevenueDo - cumulativeRevenueWait;
  const totalProfitDelta = cumulativeProfitDo - cumulativeProfitWait;
  const totalAdSpend = ifWeDo.reduce((sum, p) => sum + p.adSpend, 0);
  const roi12Month = totalAdSpend > 0 ? (totalProfitDelta / totalAdSpend) * 100 : 0;

  return {
    ifWeDo,
    ifWeWait,
    totalRevenueDelta,
    totalProfitDelta,
    breakEvenMonth: breakEvenMonth === -1 ? months + 1 : breakEvenMonth,
    roi12Month,
  };
}
