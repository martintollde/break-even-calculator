import {
  CalculatorInput,
  CalculatorOutput,
  Assumption,
  ReverseInputs,
  ReverseOutputs,
  GoalStatus,
} from './types';
import { industryDefaults } from './defaults';
import { generateScenarios, updateScenarioRecommendations } from './scenarios';
import { computeUnitEconomics, computeRoasThresholds } from './unit-economics';

export function calculateBreakEven(input: CalculatorInput): CalculatorOutput {
  const defaults = industryDefaults[input.industry];
  const assumptions: Assumption[] = [];

  // Track assumptions for confidence scoring
  // Determine margin
  let margin: number;
  if (input.grossMargin !== undefined) {
    margin = input.grossMargin / 100;
    assumptions.push({ parameter: 'Bruttomarginal', value: margin, source: 'user' });
  } else if (input.productCost !== undefined) {
    margin = (input.aov - input.productCost) / input.aov;
    assumptions.push({ parameter: 'Bruttomarginal', value: margin, source: 'user' });
  } else {
    margin = defaults.margin;
    assumptions.push({ parameter: 'Bruttomarginal', value: margin, source: 'industry_default' });
  }

  // Return rate
  const returnRate = input.returnRate !== undefined
    ? input.returnRate / 100
    : defaults.returnRate;
  assumptions.push({
    parameter: 'Returgrad',
    value: returnRate,
    source: input.returnRate !== undefined ? 'user' : 'industry_default',
  });

  // Shipping cost
  let shippingCostValue: number;
  if (input.shippingCostType === 'percent' && input.shippingCostPercent !== undefined) {
    shippingCostValue = input.aov * (input.shippingCostPercent / 100);
    assumptions.push({
      parameter: 'Fraktkostnad',
      value: shippingCostValue,
      displayValue: `${input.shippingCostPercent}% av AOV (${Math.round(shippingCostValue)} SEK)`,
      source: 'user',
    });
  } else if (input.shippingCost !== undefined) {
    shippingCostValue = input.shippingCost;
    assumptions.push({
      parameter: 'Fraktkostnad',
      value: shippingCostValue,
      displayValue: `${shippingCostValue} SEK`,
      source: 'user',
    });
  } else {
    shippingCostValue = defaults.shippingCost;
    assumptions.push({
      parameter: 'Fraktkostnad',
      value: shippingCostValue,
      displayValue: `${shippingCostValue} SEK`,
      source: 'industry_default',
    });
  }

  // Payment fee
  const paymentFee = input.paymentFee !== undefined
    ? input.paymentFee / 100
    : defaults.paymentFee;
  assumptions.push({
    parameter: 'Payment fee',
    value: paymentFee,
    source: input.paymentFee !== undefined ? 'user' : 'industry_default',
  });

  // LTV multiplier
  const ltvMultiplier = input.ltvMultiplier ?? defaults.ltvMultiplier;
  assumptions.push({
    parameter: 'LTV-multiplikator',
    value: ltvMultiplier,
    source: input.ltvMultiplier !== undefined ? 'user' : 'industry_default',
  });

  // Compute unit economics using new engine
  const ue = computeUnitEconomics(input);

  // Desired profit margin (as fraction of AOV)
  const desiredProfitMargin = input.desiredProfitMargin ?? 20;
  const desiredMarginOfAov = desiredProfitMargin / 100;

  // LTV mode
  const ltvMode = input.ltvMode ?? false;

  // Compute thresholds
  const thresholds = computeRoasThresholds(ue, input.aov, desiredMarginOfAov, ltvMultiplier, ltvMode);

  // Backward compat: netProfitPerOrder = contributionBeforeAds
  const netProfitPerOrder = ue.contributionBeforeAds;

  // CPA values
  const maxCpa = netProfitPerOrder;
  const maxCpaWithLtv = netProfitPerOrder * ltvMultiplier;

  // Break-even ROAS with LTV (always computed for display, independent of ltvMode)
  const breakEvenRoasWithLtv = maxCpaWithLtv > 0 ? input.aov / maxCpaWithLtv : Infinity;

  // Confidence level
  const userInputCount = assumptions.filter(a => a.source === 'user').length;
  let confidenceLevel: 'low' | 'medium' | 'high';
  if (userInputCount >= 4) confidenceLevel = 'high';
  else if (userInputCount >= 2) confidenceLevel = 'medium';
  else confidenceLevel = 'low';

  return {
    breakEvenRoas: thresholds.breakEvenRoas,
    targetRoas: thresholds.targetRoas,
    breakEvenCos: thresholds.breakEvenCos,
    targetCos: thresholds.targetCos,
    desiredProfitMargin,
    maxCpa,
    maxCpaWithLtv,
    breakEvenRoasWithLtv,
    confidenceLevel,
    assumptions,
    netProfitPerOrder,
    unitEconomics: ue,
    contributionBeforeAds: ue.contributionBeforeAds,
    contributionRate: ue.contributionRate,
    targetImpossible: thresholds.targetImpossible,
    ltvMode,
  };
}

// ============================================
// REVERSE CALCULATOR FUNCTIONS
// ============================================

/**
 * Bestämmer om målet är uppnåeligt baserat på ROAS-krav.
 *
 * Nya 3-reglers logik:
 * - required < breakEven → 'achievable' (budget generös nog)
 * - breakEven <= required < target → 'tight' (lönsamt men kräver optimering)
 * - required >= target → 'impossible' (underfinansierat / för högt mål)
 */
export function determineStatus(
  requiredROAS: number,
  breakEvenROAS: number,
  targetROAS: number
): GoalStatus {
  if (requiredROAS < breakEvenROAS) {
    return 'achievable';
  }

  if (requiredROAS < targetROAS) {
    return 'tight';
  }

  return 'impossible';
}

/**
 * Genererar användarmeddelanden på svenska baserat på status.
 */
export function getStatusMessages(
  status: GoalStatus,
  requiredROAS: number,
  breakEvenROAS: number,
  targetROAS: number
): { statusMessage: string; statusDetails: string } {
  const formatRoas = (roas: number) => roas.toFixed(2);

  switch (status) {
    case 'achievable':
      return {
        statusMessage: '✅ Lönsamhet möjlig',
        statusDetails: `Ditt krav på ${formatRoas(requiredROAS)}x ROAS ligger under break-even (${formatRoas(breakEvenROAS)}x). Budget är tillräcklig för att nå intäktsmålet med god marginal.`,
      };

    case 'tight':
      return {
        statusMessage: '⚠️ Möjligt men kräver optimering',
        statusDetails: `Ditt krav på ${formatRoas(requiredROAS)}x ROAS ligger mellan break-even (${formatRoas(breakEvenROAS)}x) och target (${formatRoas(targetROAS)}x). Lönsamt men kräver optimering för att nå önskad marginal.`,
      };

    case 'impossible':
      return {
        statusMessage: '❌ Underfinansierat / för högt mål',
        statusDetails: `Ditt krav på ${formatRoas(requiredROAS)}x ROAS överstiger target (${formatRoas(targetROAS)}x). Sänk intäktsmålet, öka budgeten, eller sänk önskad marginal.`,
      };
  }
}

/**
 * Huvudfunktion för bakåt-kalkylatorn.
 */
export function calculateReverse(inputs: ReverseInputs): ReverseOutputs {
  // Validera indata
  if (inputs.revenueTarget <= 0) {
    throw new Error('Intäktsmålet måste vara större än 0');
  }
  if (inputs.mediaBudget <= 0) {
    throw new Error('Mediabudgeten måste vara större än 0');
  }
  if (inputs.profitMarginGoal < 0 || inputs.profitMarginGoal > 1) {
    throw new Error('Vinstmarginalen måste vara mellan 0 och 1 (t.ex. 0.20 för 20%)');
  }
  if (inputs.economics.aov <= 0) {
    throw new Error('AOV måste vara större än 0');
  }

  // Steg 1: Beräkna required ROAS
  const requiredROAS = inputs.revenueTarget / inputs.mediaBudget;
  const requiredCOS = (1 / requiredROAS) * 100;

  // Steg 2: Framåt-beräkning för break-even och target
  const forwardInputs: CalculatorInput = {
    ...inputs.economics,
    desiredProfitMargin: inputs.profitMarginGoal * 100,
  };
  const forwardOutput = calculateBreakEven(forwardInputs);

  const breakEvenROAS = forwardOutput.breakEvenRoas;
  const targetROAS = forwardOutput.targetRoas;

  // Steg 3: Bestäm status
  const status = determineStatus(requiredROAS, breakEvenROAS, targetROAS);

  // Steg 4: Statusmeddelanden
  const { statusMessage, statusDetails } = getStatusMessages(
    status,
    requiredROAS,
    breakEvenROAS,
    targetROAS
  );

  // Steg 5: Generera scenarion
  const baseScenarios = generateScenarios(
    inputs,
    targetROAS,
    forwardOutput.netProfitPerOrder,
    forwardOutput.unitEconomics.contributionBeforeAds,
    forwardOutput.targetImpossible,
  );

  // Steg 6: Uppdatera rekommendationer baserat på status
  const scenarios = updateScenarioRecommendations(baseScenarios, status);

  return {
    requiredROAS,
    requiredCOS,
    breakEvenROAS,
    targetROAS,
    status,
    statusMessage,
    statusDetails,
    scenarios,
  };
}
