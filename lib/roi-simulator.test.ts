import { simulateROI, getDefaultConfig } from './roi-simulator';
import { ReverseInputs, ReverseScenario, ROISimulationConfig } from './types';

// ============================================
// TEST HELPERS
// ============================================

function createTestInputs(overrides?: Partial<ReverseInputs>): ReverseInputs {
  return {
    revenueTarget: 10000000,
    mediaBudget: 1000000,
    profitMarginGoal: 0.20,
    economics: {
      aov: 800,
      industry: 'ecommerce',
    },
    ...overrides,
  };
}

function createTestScenario(overrides?: Partial<ReverseScenario>): ReverseScenario {
  return {
    name: 'balance',
    label: 'Balanserad',
    recommendedBudget: 1200000,
    expectedRevenue: 10000000,
    requiredROAS: 4.0,
    requiredCOS: 25.0,
    achievedProfitMargin: 0.20,
    budgetDelta: 200000,
    budgetDeltaPercent: 20,
    revenueDelta: 0,
    revenueDeltaPercent: 0,
    profitDelta: 500000,
    isRecommended: true,
    reasoning: 'Test reasoning',
    ...overrides,
  };
}

// ============================================
// getDefaultConfig TESTS
// ============================================

describe('getDefaultConfig', () => {
  test('worst case has 4-month ramp-up and -20% variance', () => {
    const config = getDefaultConfig('worst');
    expect(config.case).toBe('worst');
    expect(config.rampUpMonths).toBe(4);
    expect(config.variancePercent).toBe(-20);
  });

  test('expected case has 3-month ramp-up and 0% variance', () => {
    const config = getDefaultConfig('expected');
    expect(config.case).toBe('expected');
    expect(config.rampUpMonths).toBe(3);
    expect(config.variancePercent).toBe(0);
  });

  test('best case has 2-month ramp-up and +15% variance', () => {
    const config = getDefaultConfig('best');
    expect(config.case).toBe('best');
    expect(config.rampUpMonths).toBe(2);
    expect(config.variancePercent).toBe(15);
  });
});

// ============================================
// simulateROI TESTS
// ============================================

describe('simulateROI', () => {
  const inputs = createTestInputs();
  const scenario = createTestScenario();
  const config = getDefaultConfig('expected');

  test('produces 12 months of projections for ifWeDo', () => {
    const result = simulateROI(inputs, scenario, config);
    expect(result.ifWeDo).toHaveLength(12);
  });

  test('produces 12 months of projections for ifWeWait', () => {
    const result = simulateROI(inputs, scenario, config);
    expect(result.ifWeWait).toHaveLength(12);
  });

  test('month numbers are 1 through 12', () => {
    const result = simulateROI(inputs, scenario, config);
    result.ifWeDo.forEach((proj, i) => {
      expect(proj.month).toBe(i + 1);
    });
  });

  test('month labels are Swedish abbreviations', () => {
    const result = simulateROI(inputs, scenario, config);
    expect(result.ifWeDo[0].label).toBe('Jan');
    expect(result.ifWeDo[4].label).toBe('Maj');
    expect(result.ifWeDo[11].label).toBe('Dec');
  });

  test('cumulative revenue is monotonically increasing for ifWeDo', () => {
    const result = simulateROI(inputs, scenario, config);
    for (let i = 1; i < result.ifWeDo.length; i++) {
      expect(result.ifWeDo[i].cumulativeRevenue).toBeGreaterThan(
        result.ifWeDo[i - 1].cumulativeRevenue
      );
    }
  });

  test('cumulative revenue is monotonically increasing for ifWeWait', () => {
    const result = simulateROI(inputs, scenario, config);
    for (let i = 1; i < result.ifWeWait.length; i++) {
      expect(result.ifWeWait[i].cumulativeRevenue).toBeGreaterThan(
        result.ifWeWait[i - 1].cumulativeRevenue
      );
    }
  });

  test('ifWeDo has higher total revenue than ifWeWait', () => {
    const result = simulateROI(inputs, scenario, config);
    const totalDo = result.ifWeDo[11].cumulativeRevenue;
    const totalWait = result.ifWeWait[11].cumulativeRevenue;
    expect(totalDo).toBeGreaterThan(totalWait);
  });

  test('totalRevenueDelta is positive', () => {
    const result = simulateROI(inputs, scenario, config);
    expect(result.totalRevenueDelta).toBeGreaterThan(0);
  });

  test('totalRevenueDelta equals difference of cumulative revenues', () => {
    const result = simulateROI(inputs, scenario, config);
    const expected = result.ifWeDo[11].cumulativeRevenue - result.ifWeWait[11].cumulativeRevenue;
    expect(result.totalRevenueDelta).toBeCloseTo(expected, 2);
  });

  test('ifWeWait has zero ad spend', () => {
    const result = simulateROI(inputs, scenario, config);
    result.ifWeWait.forEach(proj => {
      expect(proj.adSpend).toBe(0);
    });
  });

  test('ifWeDo has positive ad spend', () => {
    const result = simulateROI(inputs, scenario, config);
    result.ifWeDo.forEach(proj => {
      expect(proj.adSpend).toBeGreaterThan(0);
    });
  });

  test('ad spend ramps up during ramp-up period', () => {
    const result = simulateROI(inputs, scenario, config);
    // During ramp-up (months 1-3), ad spend should increase
    for (let i = 1; i < config.rampUpMonths; i++) {
      expect(result.ifWeDo[i].adSpend).toBeGreaterThan(result.ifWeDo[i - 1].adSpend);
    }
  });

  test('ad spend is stable after ramp-up period', () => {
    const result = simulateROI(inputs, scenario, config);
    // After ramp-up, all months should have same budget
    const fullBudget = result.ifWeDo[config.rampUpMonths].adSpend;
    for (let i = config.rampUpMonths + 1; i < 12; i++) {
      expect(result.ifWeDo[i].adSpend).toBeCloseTo(fullBudget, 2);
    }
  });

  test('break-even month is detected correctly', () => {
    const result = simulateROI(inputs, scenario, config);
    expect(result.breakEvenMonth).toBeGreaterThan(0);
    // breakEvenMonth can be 13 if never breaks even within 12 months
    expect(result.breakEvenMonth).toBeLessThanOrEqual(13);
  });

  test('cumulative profit is negative before break-even and positive at break-even', () => {
    const result = simulateROI(inputs, scenario, config);
    if (result.breakEvenMonth <= 12) {
      // At break-even month, cumulative profit should be positive
      expect(result.ifWeDo[result.breakEvenMonth - 1].cumulativeProfit).toBeGreaterThan(0);
      // Before break-even (if any), cumulative profit should be negative or zero
      if (result.breakEvenMonth > 1) {
        expect(result.ifWeDo[result.breakEvenMonth - 2].cumulativeProfit).toBeLessThanOrEqual(0);
      }
    }
  });

  test('roi12Month is calculated as percentage', () => {
    const result = simulateROI(inputs, scenario, config);
    expect(typeof result.roi12Month).toBe('number');
    expect(isFinite(result.roi12Month)).toBe(true);
  });
});

// ============================================
// CASE COMPARISON TESTS
// ============================================

describe('worst < expected < best comparison', () => {
  const inputs = createTestInputs();
  const scenario = createTestScenario();

  const worstResult = simulateROI(inputs, scenario, getDefaultConfig('worst'));
  const expectedResult = simulateROI(inputs, scenario, getDefaultConfig('expected'));
  const bestResult = simulateROI(inputs, scenario, getDefaultConfig('best'));

  test('total revenue: worst < expected < best', () => {
    expect(worstResult.totalRevenueDelta).toBeLessThan(expectedResult.totalRevenueDelta);
    expect(expectedResult.totalRevenueDelta).toBeLessThan(bestResult.totalRevenueDelta);
  });

  test('total profit: worst < expected < best', () => {
    expect(worstResult.totalProfitDelta).toBeLessThan(expectedResult.totalProfitDelta);
    expect(expectedResult.totalProfitDelta).toBeLessThan(bestResult.totalProfitDelta);
  });

  test('ROI: worst < expected < best', () => {
    expect(worstResult.roi12Month).toBeLessThan(expectedResult.roi12Month);
    expect(expectedResult.roi12Month).toBeLessThan(bestResult.roi12Month);
  });

  test('break-even month: best <= expected <= worst', () => {
    expect(bestResult.breakEvenMonth).toBeLessThanOrEqual(expectedResult.breakEvenMonth);
    expect(expectedResult.breakEvenMonth).toBeLessThanOrEqual(worstResult.breakEvenMonth);
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('edge cases', () => {
  test('handles very small budget', () => {
    const inputs = createTestInputs({ mediaBudget: 1000 });
    const scenario = createTestScenario({ recommendedBudget: 1000 });
    const config = getDefaultConfig('expected');

    const result = simulateROI(inputs, scenario, config);
    expect(result.ifWeDo).toHaveLength(12);
    expect(result.ifWeWait).toHaveLength(12);
  });

  test('handles very large budget', () => {
    const inputs = createTestInputs({ mediaBudget: 100000000 });
    const scenario = createTestScenario({ recommendedBudget: 100000000 });
    const config = getDefaultConfig('expected');

    const result = simulateROI(inputs, scenario, config);
    expect(result.ifWeDo).toHaveLength(12);
    expect(isFinite(result.totalRevenueDelta)).toBe(true);
  });

  test('handles zero profit margin scenario', () => {
    const inputs = createTestInputs();
    const scenario = createTestScenario({ achievedProfitMargin: 0 });
    const config = getDefaultConfig('expected');

    const result = simulateROI(inputs, scenario, config);
    expect(result.ifWeDo).toHaveLength(12);
    // With 0% profit margin, all profit from ads is negative (just ad spend cost)
    result.ifWeDo.forEach(proj => {
      expect(proj.profit).toBeLessThanOrEqual(0);
    });
  });

  test('different ramp-up months affect output shape', () => {
    const inputs = createTestInputs();
    const scenario = createTestScenario();

    const shortRamp: ROISimulationConfig = { case: 'best', rampUpMonths: 1, variancePercent: 0 };
    const longRamp: ROISimulationConfig = { case: 'worst', rampUpMonths: 6, variancePercent: 0 };

    const shortResult = simulateROI(inputs, scenario, shortRamp);
    const longResult = simulateROI(inputs, scenario, longRamp);

    // Short ramp should reach full spend sooner
    expect(shortResult.ifWeDo[1].adSpend).toBeGreaterThan(longResult.ifWeDo[1].adSpend);
  });
});
