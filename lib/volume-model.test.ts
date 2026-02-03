import {
  calculateManualRevenue,
  calculateManualEffectiveRoas,
  predictRoas,
  predictRevenue,
  findOptimalBudget,
  ManualVolumeConfig,
  CalibratedVolumeConfig,
} from './volume-model';

// ============================================
// MANUAL MODE TESTS
// ============================================

describe('Manual Volume Model - calculateManualRevenue', () => {
  test('elasticity=0 gives linear revenue (budget * ROAS)', () => {
    const config: ManualVolumeConfig = { elasticity: 0, roasRef: 4.0 };
    const revenue = calculateManualRevenue(100000, 4.0, config);
    // (4.0 / 4.0)^(-0) = 1.0
    expect(revenue).toBeCloseTo(400000, 0);
  });

  test('elasticity=0 with different ROAS still linear', () => {
    const config: ManualVolumeConfig = { elasticity: 0, roasRef: 4.0 };
    const revenue = calculateManualRevenue(100000, 6.0, config);
    // (6.0 / 4.0)^(-0) = 1.0
    expect(revenue).toBeCloseTo(600000, 0);
  });

  test('elasticity>0 produces diminishing returns for high ROAS', () => {
    const config: ManualVolumeConfig = { elasticity: 0.5, roasRef: 4.0 };
    const revAtRef = calculateManualRevenue(100000, 4.0, config);
    const revAtHigher = calculateManualRevenue(100000, 8.0, config);

    // At reference ROAS: (4/4)^(-0.5) = 1.0, revenue = 400000
    expect(revAtRef).toBeCloseTo(400000, 0);

    // At higher ROAS: (8/4)^(-0.5) = 2^(-0.5) ≈ 0.707
    // revenue = 100000 * 8.0 * 0.707 ≈ 565685
    // Less than linear (800000), more than at ref (400000)
    expect(revAtHigher).toBeLessThan(800000);
    expect(revAtHigher).toBeGreaterThan(revAtRef);
    expect(revAtHigher).toBeCloseTo(565685, -2);
  });

  test('elasticity=1 gives stronger diminishing returns', () => {
    const config: ManualVolumeConfig = { elasticity: 1.0, roasRef: 4.0 };
    const revAtDouble = calculateManualRevenue(100000, 8.0, config);

    // (8/4)^(-1) = 0.5, revenue = 100000 * 8.0 * 0.5 = 400000
    expect(revAtDouble).toBeCloseTo(400000, 0);
    // Same revenue as at reference ROAS - elasticity=1 means doubling ROAS
    // is fully offset by diminishing returns
  });

  test('returns 0 for zero or negative budget', () => {
    const config: ManualVolumeConfig = { elasticity: 0.5, roasRef: 4.0 };
    expect(calculateManualRevenue(0, 4.0, config)).toBe(0);
    expect(calculateManualRevenue(-1000, 4.0, config)).toBe(0);
  });

  test('returns 0 for zero or negative ROAS', () => {
    const config: ManualVolumeConfig = { elasticity: 0.5, roasRef: 4.0 };
    expect(calculateManualRevenue(100000, 0, config)).toBe(0);
    expect(calculateManualRevenue(100000, -1, config)).toBe(0);
  });

  test('returns 0 for zero roasRef', () => {
    const config: ManualVolumeConfig = { elasticity: 0.5, roasRef: 0 };
    expect(calculateManualRevenue(100000, 4.0, config)).toBe(0);
  });
});

describe('Manual Volume Model - calculateManualEffectiveRoas', () => {
  test('elasticity=0 returns roasRef regardless of budget', () => {
    const config: ManualVolumeConfig = { elasticity: 0, roasRef: 4.0 };
    expect(calculateManualEffectiveRoas(100000, 50000, config)).toBe(4.0);
    expect(calculateManualEffectiveRoas(200000, 50000, config)).toBe(4.0);
    expect(calculateManualEffectiveRoas(500000, 50000, config)).toBe(4.0);
  });

  test('elasticity>0 decreases ROAS as budget increases', () => {
    const config: ManualVolumeConfig = { elasticity: 0.5, roasRef: 4.0 };
    const roasLow = calculateManualEffectiveRoas(50000, 100000, config);
    const roasRef = calculateManualEffectiveRoas(100000, 100000, config);
    const roasHigh = calculateManualEffectiveRoas(200000, 100000, config);

    expect(roasRef).toBeCloseTo(4.0, 4);
    expect(roasLow).toBeGreaterThan(roasRef);
    expect(roasHigh).toBeLessThan(roasRef);
  });

  test('returns 0 for invalid inputs', () => {
    const config: ManualVolumeConfig = { elasticity: 0.5, roasRef: 4.0 };
    expect(calculateManualEffectiveRoas(0, 100000, config)).toBe(0);
    expect(calculateManualEffectiveRoas(100000, 0, config)).toBe(0);
  });
});

// ============================================
// CALIBRATED MODE TESTS
// ============================================

describe('Calibrated Volume Model - predictRoas', () => {
  test('known coefficients produce expected ROAS', () => {
    // ln(roas) = 2.0 + (-0.3) * ln(spend)
    // At spend=100000: ln(roas) = 2.0 + (-0.3) * ln(100000)
    // = 2.0 + (-0.3) * 11.5129 = 2.0 - 3.4539 = -1.4539
    // roas = exp(-1.4539) ≈ 0.2337
    // Wait, that gives a very low ROAS. Let me use more realistic coefficients.

    // Better: ln(roas) = a + b * ln(spend)
    // If at spend=100000 we expect ROAS=4.0:
    // ln(4.0) = a + b * ln(100000)
    // 1.386 = a + b * 11.513
    // If b = -0.1: a = 1.386 + 0.1 * 11.513 = 2.537

    const config: CalibratedVolumeConfig = { a: 2.537, b: -0.1 };
    const roas = predictRoas(100000, config);
    expect(roas).toBeCloseTo(4.0, 0);
  });

  test('higher spend decreases ROAS when b < 0', () => {
    const config: CalibratedVolumeConfig = { a: 2.537, b: -0.1 };
    const roasLow = predictRoas(50000, config);
    const roasHigh = predictRoas(200000, config);

    expect(roasLow).toBeGreaterThan(roasHigh);
  });

  test('b=0 means constant ROAS', () => {
    const config: CalibratedVolumeConfig = { a: 1.386, b: 0 };
    // exp(1.386) ≈ 4.0
    expect(predictRoas(50000, config)).toBeCloseTo(4.0, 1);
    expect(predictRoas(100000, config)).toBeCloseTo(4.0, 1);
    expect(predictRoas(200000, config)).toBeCloseTo(4.0, 1);
  });

  test('returns 0 for non-positive budget', () => {
    const config: CalibratedVolumeConfig = { a: 2.0, b: -0.3 };
    expect(predictRoas(0, config)).toBe(0);
    expect(predictRoas(-1000, config)).toBe(0);
  });
});

describe('Calibrated Volume Model - predictRevenue', () => {
  test('revenue = budget * predictedRoas', () => {
    const config: CalibratedVolumeConfig = { a: 2.537, b: -0.1 };
    const budget = 100000;
    const expectedRoas = predictRoas(budget, config);
    const revenue = predictRevenue(budget, config);

    expect(revenue).toBeCloseTo(budget * expectedRoas, 0);
  });

  test('revenue increases with budget (even with diminishing ROAS)', () => {
    const config: CalibratedVolumeConfig = { a: 2.537, b: -0.1 };
    const rev50k = predictRevenue(50000, config);
    const rev100k = predictRevenue(100000, config);
    const rev200k = predictRevenue(200000, config);

    expect(rev100k).toBeGreaterThan(rev50k);
    expect(rev200k).toBeGreaterThan(rev100k);
  });

  test('returns 0 for non-positive budget', () => {
    const config: CalibratedVolumeConfig = { a: 2.0, b: -0.3 };
    expect(predictRevenue(0, config)).toBe(0);
  });
});

// ============================================
// OPTIMAL BUDGET SEARCH TESTS
// ============================================

describe('Calibrated Volume Model - findOptimalBudget', () => {
  // Use realistic coefficients where optimal budget falls in a sensible range.
  // With a=4.0, b=-0.15, margin=0.20:
  // ROAS at 500k ≈ 5.89, revenue ≈ 2.94M, profit ≈ 89k
  // Analytical optimum: budget_opt = (exp(a) * margin * (1+b))^(1/(1-b))

  const config: CalibratedVolumeConfig = { a: 4.0, b: -0.15 };
  const profitMargin = 0.20;

  test('finds optimal budget that maximizes profit', () => {
    const result = findOptimalBudget(config, profitMargin, 1000, 10000000);

    // Verify analytically:
    // d(profit)/d(budget) = exp(a) * margin * (1+b) * budget^b - 1 = 0
    // budget^b = 1 / (exp(a) * margin * (1+b))
    // budget = (1 / (exp(a) * margin * (1+b)))^(1/b)
    const analyticalBudget = Math.pow(
      1 / (Math.exp(config.a) * profitMargin * (1 + config.b)),
      1 / config.b
    );

    expect(result.budget).toBeCloseTo(analyticalBudget, -4); // within 5000 SEK
    expect(result.profit).toBeGreaterThan(0);
    expect(result.revenue).toBeGreaterThan(result.budget);
  });

  test('profit at optimal is higher than at boundaries', () => {
    const result = findOptimalBudget(config, profitMargin, 10000, 5000000);

    const profitAtMin = predictRevenue(10000, config) * profitMargin - 10000;
    const profitAtMax = predictRevenue(5000000, config) * profitMargin - 5000000;

    expect(result.profit).toBeGreaterThanOrEqual(profitAtMin);
    expect(result.profit).toBeGreaterThanOrEqual(profitAtMax);
  });

  test('returned revenue matches predictRevenue at optimal budget', () => {
    const result = findOptimalBudget(config, profitMargin, 1000, 5000000);
    const expectedRevenue = predictRevenue(result.budget, config);

    expect(result.revenue).toBeCloseTo(expectedRevenue, 0);
  });
});
