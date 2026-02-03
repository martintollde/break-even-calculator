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

export function calculateBreakEven(input: CalculatorInput): CalculatorOutput {
  const defaults = industryDefaults[input.industry];
  const assumptions: Assumption[] = [];

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
  let shippingCost: number;
  if (input.shippingCostType === 'percent' && input.shippingCostPercent !== undefined) {
    shippingCost = input.aov * (input.shippingCostPercent / 100);
    assumptions.push({
      parameter: 'Fraktkostnad',
      value: shippingCost,
      displayValue: `${input.shippingCostPercent}% av AOV (${Math.round(shippingCost)} SEK)`,
      source: 'user',
    });
  } else if (input.shippingCost !== undefined) {
    shippingCost = input.shippingCost;
    assumptions.push({
      parameter: 'Fraktkostnad',
      value: shippingCost,
      displayValue: `${shippingCost} SEK`,
      source: 'user',
    });
  } else {
    shippingCost = defaults.shippingCost;
    assumptions.push({
      parameter: 'Fraktkostnad',
      value: shippingCost,
      displayValue: `${shippingCost} SEK`,
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

  // Calculations
  const effectiveRevenue = input.aov * (1 - returnRate);
  const paymentCost = input.aov * paymentFee;
  const netProfitPerOrder = (effectiveRevenue * margin) - shippingCost - paymentCost;

  const breakEvenRoas = netProfitPerOrder > 0 ? input.aov / netProfitPerOrder : Infinity;
  const maxCpa = netProfitPerOrder;
  const maxCpaWithLtv = netProfitPerOrder * ltvMultiplier;

  // Target ROAS based on desired profit margin
  const desiredProfitMargin = input.desiredProfitMargin ?? 20;
  const profitRetention = 1 - (desiredProfitMargin / 100);
  const targetRoas = netProfitPerOrder > 0 ? input.aov / (netProfitPerOrder * profitRetention) : Infinity;

  // COS values (inverse of ROAS)
  const breakEvenCos = isFinite(breakEvenRoas) ? (1 / breakEvenRoas) * 100 : 0;
  const targetCos = isFinite(targetRoas) ? (1 / targetRoas) * 100 : 0;

  // Break-even ROAS with LTV
  const breakEvenRoasWithLtv = maxCpaWithLtv > 0 ? input.aov / maxCpaWithLtv : Infinity;

  // Confidence level
  const userInputCount = assumptions.filter(a => a.source === 'user').length;
  let confidenceLevel: 'low' | 'medium' | 'high';
  if (userInputCount >= 4) confidenceLevel = 'high';
  else if (userInputCount >= 2) confidenceLevel = 'medium';
  else confidenceLevel = 'low';

  return {
    breakEvenRoas,
    targetRoas,
    breakEvenCos,
    targetCos,
    desiredProfitMargin,
    maxCpa,
    maxCpaWithLtv,
    breakEvenRoasWithLtv,
    confidenceLevel,
    assumptions,
    netProfitPerOrder,
  };
}

// ============================================
// REVERSE CALCULATOR FUNCTIONS
// ============================================

/**
 * Bestämmer om målet är uppnåeligt baserat på ROAS-krav.
 *
 * Logik:
 * - requiredROAS < breakEvenROAS → 'impossible' (förlorar pengar på varje order)
 * - requiredROAS <= targetROAS → 'achievable' (når vinstmarginal)
 * - requiredROAS > targetROAS → 'tight' (över break-even men under målmarginal)
 *
 * @param requiredROAS - ROAS som krävs för att nå intäktsmålet
 * @param breakEvenROAS - ROAS för att gå +/- 0
 * @param targetROAS - ROAS för att nå önskad vinstmarginal
 * @returns Status för måluppfyllnad
 */
export function determineStatus(
  requiredROAS: number,
  breakEvenROAS: number,
  targetROAS: number
): GoalStatus {
  // Om required ROAS är under break-even är det omöjligt att gå med vinst
  if (requiredROAS < breakEvenROAS) {
    return 'impossible';
  }

  // Om required ROAS är under eller lika med target har vi marginal att jobba med
  if (requiredROAS <= targetROAS) {
    return 'achievable';
  }

  // Över target men under break-even - utmanande men möjligt
  return 'tight';
}

/**
 * Genererar användarmeddelanden på svenska baserat på status.
 *
 * @param status - Aktuell målstatus
 * @param requiredROAS - ROAS som krävs
 * @param breakEvenROAS - Break-even ROAS
 * @param targetROAS - Target ROAS för önskad vinstmarginal
 * @returns Objekt med statusMessage och statusDetails
 */
export function getStatusMessages(
  status: GoalStatus,
  requiredROAS: number,
  breakEvenROAS: number,
  targetROAS: number
): { statusMessage: string; statusDetails: string } {
  const formatRoas = (roas: number) => roas.toFixed(2);
  const marginAboveBreakeven = ((requiredROAS - breakEvenROAS) / breakEvenROAS) * 100;
  const marginAboveTarget = ((requiredROAS - targetROAS) / targetROAS) * 100;

  switch (status) {
    case 'achievable':
      return {
        statusMessage: '✅ Realistiskt uppnåeligt',
        statusDetails: `Ditt krav på ${formatRoas(requiredROAS)}x ROAS ligger ${Math.abs(marginAboveBreakeven).toFixed(0)}% över break-even (${formatRoas(breakEvenROAS)}x) och under ditt targetmål (${formatRoas(targetROAS)}x). Du har god marginal för att nå önskad vinst.`,
      };

    case 'tight':
      return {
        statusMessage: '⚠️ Utmanande men möjligt',
        statusDetails: `Ditt krav på ${formatRoas(requiredROAS)}x ROAS ligger ${marginAboveTarget.toFixed(0)}% över ditt targetmål (${formatRoas(targetROAS)}x). Du kommer gå med vinst men inte nå önskad vinstmarginal. Överväg att sänka intäktsmålet eller öka budgeten.`,
      };

    case 'impossible':
      return {
        statusMessage: '❌ Omöjligt med nuvarande ekonomi',
        statusDetails: `Ditt krav på ${formatRoas(requiredROAS)}x ROAS ligger under break-even (${formatRoas(breakEvenROAS)}x). Med dessa siffror förlorar du pengar på varje försäljning. Förbättra marginalen, sänk kostnaderna, eller justera målen.`,
      };
  }
}

/**
 * Huvudfunktion för bakåt-kalkylatorn.
 *
 * Beräknar vad som krävs för att nå ett intäktsmål givet en mediabudget.
 * Returnerar status, meddelanden och tre scenarion med olika strategier.
 *
 * @param inputs - Användarens indata med affärsmål och ekonomiska parametrar
 * @returns Komplett resultat med ROAS-krav, status och scenarion
 * @throws Error om indata är ogiltiga
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

  // Steg 1: Beräkna required ROAS från användarens mål
  // required_ROAS = revenue_target / media_budget
  const requiredROAS = inputs.revenueTarget / inputs.mediaBudget;
  const requiredCOS = (1 / requiredROAS) * 100;

  // Steg 2: Återanvänd framåt-kalkylatorn för att få break-even och target
  // Vi sätter desiredProfitMargin baserat på profitMarginGoal
  const forwardInputs: CalculatorInput = {
    ...inputs.economics,
    desiredProfitMargin: inputs.profitMarginGoal * 100, // Konvertera från decimal till procent
  };
  const forwardOutput = calculateBreakEven(forwardInputs);

  const breakEvenROAS = forwardOutput.breakEvenRoas;
  const targetROAS = forwardOutput.targetRoas;

  // Steg 3: Bestäm status
  const status = determineStatus(requiredROAS, breakEvenROAS, targetROAS);

  // Steg 4: Hämta statusmeddelanden
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
    forwardOutput.netProfitPerOrder
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
