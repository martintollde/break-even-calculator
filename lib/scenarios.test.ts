import {
  generateScenarios,
  updateScenarioRecommendations,
  formatCurrency,
  formatPercent,
  formatPercentNoSign,
} from './scenarios';
import { calculateBreakEven } from './calculations';
import { ReverseInputs, CalculatorInput } from './types';

describe('Scenarios - Scenariogenerering', () => {

  const baseEconomics: CalculatorInput = {
    aov: 1000,
    industry: 'other',
    grossMargin: 50,
    returnRate: 0,
    shippingCost: 0,
    paymentFee: 0,
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  describe('formatCurrency - Valutaformatering', () => {
    test('Formaterar positivt belopp korrekt', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('kr');
    });

    test('Formaterar litet belopp korrekt', () => {
      const result = formatCurrency(500);
      expect(result).toContain('500');
      expect(result).toContain('kr');
    });

    test('Formaterar noll korrekt', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
      expect(result).toContain('kr');
    });

    test('Avrundar decimaler', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1');
      expect(result).toContain('235');
    });
  });

  describe('formatPercent - Procentformatering med tecken', () => {
    test('Formaterar positivt värde med plus-tecken', () => {
      expect(formatPercent(0.25)).toBe('+25.0%');
    });

    test('Formaterar negativt värde med minus-tecken', () => {
      expect(formatPercent(-0.15)).toBe('-15.0%');
    });

    test('Formaterar noll med plus-tecken', () => {
      expect(formatPercent(0)).toBe('+0.0%');
    });
  });

  describe('formatPercentNoSign', () => {
    test('Formaterar positivt värde utan tecken', () => {
      expect(formatPercentNoSign(0.25)).toBe('25.0%');
    });

    test('Formaterar noll', () => {
      expect(formatPercentNoSign(0)).toBe('0.0%');
    });
  });

  // ============================================
  // GENERATE SCENARIOS
  // ============================================

  describe('generateScenarios - Grundläggande funktionalitet', () => {

    test('Genererar tre scenarion med nya namn', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      expect(scenarios.budgetForTarget).toBeDefined();
      expect(scenarios.maxRevenueGivenBudget).toBeDefined();
      expect(scenarios.maxProfitGivenMinRevenue).toBeDefined();
    });

    test('budgetForTarget: reaches revenue target at target ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      expect(scenarios.budgetForTarget.expectedRevenue).toBe(1000000);
      expect(scenarios.budgetForTarget.requiredROAS).toBeCloseTo(forwardResult.targetRoas, 2);
      expect(scenarios.budgetForTarget.label).toBe('Budget för mål');
      expect(scenarios.budgetForTarget.isRecommended).toBe(true);
    });

    test('maxRevenueGivenBudget: uses current budget', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      expect(scenarios.maxRevenueGivenBudget.recommendedBudget).toBe(250000);
      expect(scenarios.maxRevenueGivenBudget.budgetDelta).toBe(0);
      expect(scenarios.maxRevenueGivenBudget.label).toBe('Max omsättning');
      // max revenue = budget * targetROAS = 250000 * 3.333 = 833333
      expect(scenarios.maxRevenueGivenBudget.expectedRevenue).toBeCloseTo(250000 * forwardResult.targetRoas, 0);
    });

    test('maxProfitGivenMinRevenue: uses minRevenuePercent', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
        minRevenuePercent: 80,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      // Revenue should be 80% of target
      expect(scenarios.maxProfitGivenMinRevenue.expectedRevenue).toBeCloseTo(800000, 0);
      expect(scenarios.maxProfitGivenMinRevenue.label).toBe('Max vinst');
    });

    test('budgetForTarget markeras som rekommenderat', () => {
      const input: ReverseInputs = {
        revenueTarget: 500000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      expect(scenarios.budgetForTarget.isRecommended).toBe(true);
      expect(scenarios.maxRevenueGivenBudget.isRecommended).toBe(false);
      expect(scenarios.maxProfitGivenMinRevenue.isRecommended).toBe(false);
    });
  });

  describe('generateScenarios - Delta-beräkningar', () => {

    test('budgetForTarget budget delta korrekt', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      const expectedDelta = scenarios.budgetForTarget.recommendedBudget - 250000;
      expect(scenarios.budgetForTarget.budgetDelta).toBeCloseTo(expectedDelta, 0);
    });

    test('maxRevenueGivenBudget has zero budget delta', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      expect(scenarios.maxRevenueGivenBudget.budgetDelta).toBe(0);
      expect(scenarios.maxRevenueGivenBudget.budgetDeltaPercent).toBe(0);
    });

    test('budgetForTarget has zero revenue delta', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );

      expect(scenarios.budgetForTarget.revenueDelta).toBe(0);
      expect(scenarios.budgetForTarget.revenueDeltaPercent).toBe(0);
    });
  });

  // ============================================
  // UPDATE SCENARIO RECOMMENDATIONS
  // ============================================

  describe('updateScenarioRecommendations', () => {

    function getScenarios() {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };
      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 20,
      });
      return generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder,
        forwardResult.contributionBeforeAds,
        forwardResult.targetImpossible,
      );
    }

    test('Achievable → budgetForTarget rekommenderas', () => {
      const updated = updateScenarioRecommendations(getScenarios(), 'achievable');
      expect(updated.budgetForTarget.isRecommended).toBe(true);
      expect(updated.maxRevenueGivenBudget.isRecommended).toBe(false);
      expect(updated.maxProfitGivenMinRevenue.isRecommended).toBe(false);
    });

    test('Tight → maxProfitGivenMinRevenue rekommenderas', () => {
      const updated = updateScenarioRecommendations(getScenarios(), 'tight');
      expect(updated.maxProfitGivenMinRevenue.isRecommended).toBe(true);
      expect(updated.budgetForTarget.isRecommended).toBe(false);
      expect(updated.maxRevenueGivenBudget.isRecommended).toBe(false);
    });

    test('Impossible → maxRevenueGivenBudget rekommenderas', () => {
      const updated = updateScenarioRecommendations(getScenarios(), 'impossible');
      expect(updated.maxRevenueGivenBudget.isRecommended).toBe(true);
      expect(updated.budgetForTarget.isRecommended).toBe(false);
      expect(updated.maxProfitGivenMinRevenue.isRecommended).toBe(false);
    });

    test('Muterar inte original-scenarion', () => {
      const baseScenarios = getScenarios();
      const original = baseScenarios.budgetForTarget.isRecommended;
      updateScenarioRecommendations(baseScenarios, 'impossible');
      expect(baseScenarios.budgetForTarget.isRecommended).toBe(original);
    });
  });

  // ============================================
  // SCENARIO LABELS
  // ============================================

  describe('Scenario labels och reasoning', () => {

    test('budgetForTarget har korrekta labels', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };
      const forwardResult = calculateBreakEven({ ...baseEconomics, desiredProfitMargin: 20 });
      const scenarios = generateScenarios(input, forwardResult.targetRoas, forwardResult.netProfitPerOrder, forwardResult.contributionBeforeAds, forwardResult.targetImpossible);

      expect(scenarios.budgetForTarget.name).toBe('budgetForTarget');
      expect(scenarios.budgetForTarget.label).toBe('Budget för mål');
      expect(scenarios.budgetForTarget.reasoning).toContain('Kräver budget');
    });

    test('maxRevenueGivenBudget har korrekta labels', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };
      const forwardResult = calculateBreakEven({ ...baseEconomics, desiredProfitMargin: 20 });
      const scenarios = generateScenarios(input, forwardResult.targetRoas, forwardResult.netProfitPerOrder, forwardResult.contributionBeforeAds, forwardResult.targetImpossible);

      expect(scenarios.maxRevenueGivenBudget.name).toBe('maxRevenueGivenBudget');
      expect(scenarios.maxRevenueGivenBudget.label).toBe('Max omsättning');
      expect(scenarios.maxRevenueGivenBudget.reasoning).toContain('nuvarande budget');
    });

    test('maxProfitGivenMinRevenue har korrekta labels', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };
      const forwardResult = calculateBreakEven({ ...baseEconomics, desiredProfitMargin: 20 });
      const scenarios = generateScenarios(input, forwardResult.targetRoas, forwardResult.netProfitPerOrder, forwardResult.contributionBeforeAds, forwardResult.targetImpossible);

      expect(scenarios.maxProfitGivenMinRevenue.name).toBe('maxProfitGivenMinRevenue');
      expect(scenarios.maxProfitGivenMinRevenue.label).toBe('Max vinst');
      expect(scenarios.maxProfitGivenMinRevenue.reasoning).toContain('Optimerar vinst');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('generateScenarios - Edge cases', () => {

    test('Hanterar högt intäktsmål', () => {
      const input: ReverseInputs = {
        revenueTarget: 100000000,
        mediaBudget: 10000000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };
      const forwardResult = calculateBreakEven({ ...baseEconomics, desiredProfitMargin: 20 });
      const scenarios = generateScenarios(input, forwardResult.targetRoas, forwardResult.netProfitPerOrder, forwardResult.contributionBeforeAds, forwardResult.targetImpossible);

      expect(scenarios.budgetForTarget.expectedRevenue).toBe(100000000);
      expect(scenarios.budgetForTarget.recommendedBudget).toBeGreaterThan(0);
    });

    test('Hanterar lågt intäktsmål', () => {
      const input: ReverseInputs = {
        revenueTarget: 10000,
        mediaBudget: 5000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };
      const forwardResult = calculateBreakEven({ ...baseEconomics, desiredProfitMargin: 20 });
      const scenarios = generateScenarios(input, forwardResult.targetRoas, forwardResult.netProfitPerOrder, forwardResult.contributionBeforeAds, forwardResult.targetImpossible);

      expect(scenarios.budgetForTarget.expectedRevenue).toBe(10000);
      expect(isFinite(scenarios.budgetForTarget.requiredROAS)).toBe(true);
    });
  });
});
