import { computeUnitEconomics, computeRoasThresholds, UnitEconomics } from './unit-economics';
import { CalculatorInput } from './types';

describe('Unit Economics - computeUnitEconomics', () => {

  test('Pure contribution: 50% margin, 0% returns, no costs', () => {
    const input: CalculatorInput = {
      aov: 1000,
      industry: 'other',
      grossMargin: 50,
      returnRate: 0,
      shippingCost: 0,
      paymentFee: 0,
    };

    const ue = computeUnitEconomics(input);

    // productCost = 1000 * (1 - 0.5) = 500
    expect(ue.productCost).toBeCloseTo(500, 2);
    // productCostEffective = 500 * (1 + 0) = 500
    expect(ue.productCostEffective).toBeCloseTo(500, 2);
    expect(ue.shippingCost).toBe(0);
    expect(ue.paymentFee).toBe(0);
    // contribution = 1000 - (500 + 0 + 0) = 500
    expect(ue.contributionBeforeAds).toBeCloseTo(500, 2);
    expect(ue.contributionRate).toBeCloseTo(0.5, 4);
  });

  test('With returns: returns increase product cost', () => {
    const input: CalculatorInput = {
      aov: 1000,
      industry: 'other',
      grossMargin: 50,
      returnRate: 10,
      shippingCost: 0,
      paymentFee: 0,
    };

    const ue = computeUnitEconomics(input);

    // productCost = 500
    // productCostEffective = 500 * 1.10 = 550
    expect(ue.productCostEffective).toBeCloseTo(550, 2);
    // contribution = 1000 - 550 = 450
    expect(ue.contributionBeforeAds).toBeCloseTo(450, 2);
  });

  test('With all costs', () => {
    const input: CalculatorInput = {
      aov: 1200,
      industry: 'ecommerce',
      grossMargin: 55,
      returnRate: 8,
      shippingCost: 59,
      paymentFee: 2.5,
    };

    const ue = computeUnitEconomics(input);

    // productCost = 1200 * (1 - 0.55) = 540
    expect(ue.productCost).toBeCloseTo(540, 2);
    // productCostEffective = 540 * 1.08 = 583.20
    expect(ue.productCostEffective).toBeCloseTo(583.20, 2);
    expect(ue.shippingCost).toBe(59);
    // paymentFee = 1200 * 0.025 = 30
    expect(ue.paymentFee).toBeCloseTo(30, 2);
    // contribution = 1200 - (583.20 + 59 + 30) = 527.80
    expect(ue.contributionBeforeAds).toBeCloseTo(527.80, 2);
  });

  test('productCost explicit overrides grossMargin', () => {
    const input: CalculatorInput = {
      aov: 1000,
      industry: 'other',
      productCost: 600,
      returnRate: 0,
      shippingCost: 0,
      paymentFee: 0,
    };

    const ue = computeUnitEconomics(input);

    expect(ue.productCost).toBe(600);
    expect(ue.contributionBeforeAds).toBeCloseTo(400, 2);
  });

  test('Shipping as percent of AOV', () => {
    const input: CalculatorInput = {
      aov: 1000,
      industry: 'other',
      grossMargin: 50,
      returnRate: 0,
      shippingCostType: 'percent',
      shippingCostPercent: 5,
      paymentFee: 0,
    };

    const ue = computeUnitEconomics(input);

    expect(ue.shippingCost).toBeCloseTo(50, 2);
    // contribution = 1000 - (500 + 50 + 0) = 450
    expect(ue.contributionBeforeAds).toBeCloseTo(450, 2);
  });

  test('Negative contribution when costs exceed AOV', () => {
    const input: CalculatorInput = {
      aov: 200,
      industry: 'other',
      grossMargin: 20,
      returnRate: 0,
      shippingCost: 50,
      paymentFee: 0,
    };

    const ue = computeUnitEconomics(input);

    // productCost = 200 * 0.80 = 160
    // contribution = 200 - (160 + 50 + 0) = -10
    expect(ue.contributionBeforeAds).toBeCloseTo(-10, 2);
  });

  test('Uses industry defaults when no user inputs', () => {
    const input: CalculatorInput = {
      aov: 1000,
      industry: 'ecommerce',
    };

    const ue = computeUnitEconomics(input);

    // E-commerce defaults: margin 50%, returnRate 8%, shipping 49, paymentFee 2.5%
    // productCost = 1000 * 0.50 = 500
    // productCostEffective = 500 * 1.08 = 540
    // paymentFee = 1000 * 0.025 = 25
    // contribution = 1000 - (540 + 49 + 25) = 386
    expect(ue.contributionBeforeAds).toBeCloseTo(386, 2);
  });
});

describe('Unit Economics - computeRoasThresholds', () => {

  function makeUe(contributionBeforeAds: number, aov: number = 1000): UnitEconomics {
    return {
      aov,
      productCost: aov - contributionBeforeAds,
      productCostEffective: aov - contributionBeforeAds,
      shippingCost: 0,
      paymentFee: 0,
      contributionBeforeAds,
      contributionRate: contributionBeforeAds / aov,
    };
  }

  test('Break-even ROAS from known contribution', () => {
    const ue = makeUe(500); // AOV=1000, contribution=500
    const th = computeRoasThresholds(ue, 1000, 0.20);

    // breakEvenRoas = 1000 / 500 = 2.0
    expect(th.breakEvenRoas).toBeCloseTo(2.0, 4);
  });

  test('Target ROAS with % of AOV semantics', () => {
    const ue = makeUe(500); // AOV=1000, contribution=500
    const th = computeRoasThresholds(ue, 1000, 0.20);

    // maxAdCostTarget = 500 - 1000 * 0.20 = 300
    // targetRoas = 1000 / 300 = 3.333...
    expect(th.maxAdCostTarget).toBeCloseTo(300, 2);
    expect(th.targetRoas).toBeCloseTo(3.333, 2);
    expect(th.targetImpossible).toBe(false);
  });

  test('Old model comparison: target ROAS is higher with % of AOV semantics', () => {
    // Old model: targetRoas = AOV / (netProfit * (1 - margin)) = 1000 / (500 * 0.80) = 2.5
    // New model: targetRoas = AOV / (contribution - AOV * margin) = 1000 / (500 - 200) = 3.333
    const ue = makeUe(500);
    const th = computeRoasThresholds(ue, 1000, 0.20);
    expect(th.targetRoas).toBeCloseTo(3.333, 2);
    // This is indeed higher than the old 2.5
    expect(th.targetRoas).toBeGreaterThan(2.5);
  });

  test('LTV mode uses effective AOV', () => {
    const ue = makeUe(500);
    const thNoLtv = computeRoasThresholds(ue, 1000, 0.20, 1.5, false);
    const thLtv = computeRoasThresholds(ue, 1000, 0.20, 1.5, true);

    // Without LTV: breakEven = 1000 / 500 = 2.0
    expect(thNoLtv.breakEvenRoas).toBeCloseTo(2.0, 4);
    // With LTV: effectiveAov = 1000 * 1.5 = 1500, breakEven = 1500 / 500 = 3.0
    // Wait, that's higher... LTV should LOWER break-even requirements
    // Actually no: with LTV, effectiveAov is higher because you get more revenue
    // But the formula is effectiveAov / contribution, so it would be higher ROAS
    // The intention is that LTV allows you to pay MORE for acquisition
    // Let me reconsider: LTV means each customer is worth more long term
    // So break-even ROAS should be LOWER (you can afford lower ROAS)
    // The correct formula should use effectiveAov in numerator
    // breakEvenRoas = effectiveAov / contribution = 1500 / 500 = 3.0 (higher, not lower!)
    // This seems wrong. Let me re-read the spec...
    // Actually the spec says: effectiveAov = ltvMode ? AOV * ltvMultiplier : AOV
    // breakEvenRoas = effectiveAov / contributionBeforeAds
    // This means with LTV mode, break-even ROAS is HIGHER (since you expect more revenue per customer)
    // But that makes the COS requirement more lenient:
    // breakEvenCos = 1/3.0 * 100 = 33.3% vs 1/2.0 * 100 = 50%
    // So you need HIGHER ROAS but can tolerate HIGHER COS... that's equivalent
    // Actually the math: if effectiveAov is higher, and COS = 1/ROAS,
    // then higher ROAS means lower COS which is MORE restrictive, not less
    // Wait, this is because contribution doesn't change with LTV
    // The correct interpretation: with LTV, you VALUE each customer more
    // So the break-even is about getting more lifetime value from the same cost base
    // Higher break-even ROAS actually means the bar is higher...
    // Let me just verify the spec's formula works as stated
    expect(thLtv.breakEvenRoas).toBeCloseTo(3.0, 4);

    // Target with LTV: maxAdCostTarget = 500 - 1500 * 0.20 = 500 - 300 = 200
    // targetRoas = 1500 / 200 = 7.5
    expect(thLtv.targetRoas).toBeCloseTo(7.5, 2);
  });

  test('targetImpossible when desiredMargin >= contributionRate', () => {
    const ue = makeUe(200); // AOV=1000, contributionRate=20%
    // desiredMargin = 25% of AOV = 250 > 200 contribution
    const th = computeRoasThresholds(ue, 1000, 0.25);

    expect(th.targetImpossible).toBe(true);
    expect(th.targetRoas).toBe(Infinity);
    expect(th.maxAdCostTarget).toBeLessThanOrEqual(0);
  });

  test('Negative contribution gives Infinity break-even', () => {
    const ue = makeUe(-10);
    const th = computeRoasThresholds(ue, 1000, 0.20);

    expect(th.breakEvenRoas).toBe(Infinity);
    expect(th.targetImpossible).toBe(true);
  });

  test('COS values are correct inverse of ROAS', () => {
    const ue = makeUe(500);
    const th = computeRoasThresholds(ue, 1000, 0.20);

    expect(th.breakEvenCos).toBeCloseTo(50, 2);
    expect(th.targetCos).toBeCloseTo(30, 1);
  });

  test('Full scenario: AOV=1200, m=55%, r=8%, s=59, p=2.5%', () => {
    const input: CalculatorInput = {
      aov: 1200,
      industry: 'ecommerce',
      grossMargin: 55,
      returnRate: 8,
      shippingCost: 59,
      paymentFee: 2.5,
    };

    const ue = computeUnitEconomics(input);
    // productCost = 1200 * 0.45 = 540
    // productCostEffective = 540 * 1.08 = 583.20
    // paymentFee = 1200 * 0.025 = 30
    // contribution = 1200 - (583.20 + 59 + 30) = 527.80
    expect(ue.contributionBeforeAds).toBeCloseTo(527.80, 2);

    const th = computeRoasThresholds(ue, 1200, 0.20);
    // breakEvenRoas = 1200 / 527.80 = 2.273
    expect(th.breakEvenRoas).toBeCloseTo(2.273, 2);

    // maxAdCostTarget = 527.80 - 1200 * 0.20 = 527.80 - 240 = 287.80
    // targetRoas = 1200 / 287.80 = 4.169
    expect(th.targetRoas).toBeCloseTo(4.169, 2);
  });
});
