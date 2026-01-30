import { CalculatorInput, CalculatorOutput, Assumption } from './types';
import { industryDefaults } from './defaults';

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
