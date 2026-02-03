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

  // Bas-ekonomi för de flesta tester
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
      // Swedish locale uses "kr" not "SEK"
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

    test('Formaterar negativt belopp korrekt', () => {
      const result = formatCurrency(-5000);
      expect(result).toContain('5');
      expect(result).toContain('000');
    });

    test('Avrundar decimaler', () => {
      const result = formatCurrency(1234.56);
      // Ska avrundas till heltal
      expect(result).toContain('1');
      expect(result).toContain('235');
    });
  });

  describe('formatPercent - Procentformatering med tecken', () => {

    test('Formaterar positivt värde med plus-tecken', () => {
      const result = formatPercent(0.25);
      expect(result).toBe('+25.0%');
    });

    test('Formaterar negativt värde med minus-tecken', () => {
      const result = formatPercent(-0.15);
      expect(result).toBe('-15.0%');
    });

    test('Formaterar noll med plus-tecken', () => {
      const result = formatPercent(0);
      expect(result).toBe('+0.0%');
    });

    test('Formaterar litet decimal värde', () => {
      const result = formatPercent(0.005);
      expect(result).toBe('+0.5%');
    });
  });

  describe('formatPercentNoSign - Procentformatering utan tecken', () => {

    test('Formaterar positivt värde utan tecken', () => {
      const result = formatPercentNoSign(0.25);
      expect(result).toBe('25.0%');
    });

    test('Formaterar negativt värde med minus-tecken', () => {
      const result = formatPercentNoSign(-0.15);
      expect(result).toBe('-15.0%');
    });

    test('Formaterar noll', () => {
      const result = formatPercentNoSign(0);
      expect(result).toBe('0.0%');
    });
  });

  // ============================================
  // GENERATE SCENARIOS
  // ============================================

  describe('generateScenarios - Grundläggande funktionalitet', () => {

    test('Genererar tre scenarion', () => {
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.balance).toBeDefined();
      expect(scenarios.maxRevenue).toBeDefined();
      expect(scenarios.maxProfit).toBeDefined();
    });

    test('Balance scenario matchar intäktsmål med target ROAS', () => {
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
        forwardResult.netProfitPerOrder
      );

      // Balance ska nå intäktsmålet
      expect(scenarios.balance.expectedRevenue).toBe(1000000);
      // Med target ROAS
      expect(scenarios.balance.requiredROAS).toBeCloseTo(forwardResult.targetRoas, 2);
      // Och önskad vinstmarginal
      expect(scenarios.balance.achievedProfitMargin).toBe(0.20);
    });

    test('maxRevenue scenario har samma intäkt som balance', () => {
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
        forwardResult.netProfitPerOrder
      );

      // maxRevenue når samma intäkt som balance
      expect(scenarios.maxRevenue.expectedRevenue).toBe(scenarios.balance.expectedRevenue);
      // Och samma ROAS
      expect(scenarios.maxRevenue.requiredROAS).toBeCloseTo(scenarios.balance.requiredROAS, 2);
    });

    test('maxProfit scenario har högsta vinstmarginalen', () => {
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
        forwardResult.netProfitPerOrder
      );

      // maxProfit har högst vinstmarginal (25% högre än mål)
      expect(scenarios.maxProfit.achievedProfitMargin).toBeGreaterThan(scenarios.balance.achievedProfitMargin);
      expect(scenarios.maxProfit.achievedProfitMargin).toBeCloseTo(0.25, 2); // 0.20 × 1.25
    });

    test('Balance markeras som rekommenderat', () => {
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.balance.isRecommended).toBe(true);
      expect(scenarios.maxRevenue.isRecommended).toBe(false);
      expect(scenarios.maxProfit.isRecommended).toBe(false);
    });
  });

  describe('generateScenarios - Delta-beräkningar', () => {

    test('Beräknar budget delta korrekt', () => {
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
        forwardResult.netProfitPerOrder
      );

      // Budget delta = recommendedBudget - mediaBudget
      const expectedBalanceDelta = scenarios.balance.recommendedBudget - 250000;
      expect(scenarios.balance.budgetDelta).toBeCloseTo(expectedBalanceDelta, 0);
    });

    test('Beräknar budget delta procent korrekt', () => {
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
        forwardResult.netProfitPerOrder
      );

      // Budget delta % = (budgetDelta / mediaBudget) × 100
      const expectedPercent = (scenarios.balance.budgetDelta / 250000) * 100;
      expect(scenarios.balance.budgetDeltaPercent).toBeCloseTo(expectedPercent, 1);
    });

    test('Balance har revenueDelta = 0', () => {
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
        forwardResult.netProfitPerOrder
      );

      // Balance når exakt intäktsmålet
      expect(scenarios.balance.revenueDelta).toBe(0);
      expect(scenarios.balance.revenueDeltaPercent).toBe(0);
    });

    test('Beräknar profitDelta korrekt', () => {
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
        forwardResult.netProfitPerOrder
      );

      // profitDelta = (revenue / aov) × netProfitPerOrder × profitMargin
      const expectedProfit = (1000000 / 1000) * forwardResult.netProfitPerOrder * 0.20;
      expect(scenarios.balance.profitDelta).toBeCloseTo(expectedProfit, 0);
    });
  });

  describe('generateScenarios - Edge cases', () => {

    test('Hanterar högt intäktsmål', () => {
      const input: ReverseInputs = {
        revenueTarget: 100000000, // 100 MSEK
        mediaBudget: 10000000,
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.balance.expectedRevenue).toBe(100000000);
      expect(scenarios.balance.recommendedBudget).toBeGreaterThan(0);
    });

    test('Hanterar lågt intäktsmål', () => {
      const input: ReverseInputs = {
        revenueTarget: 10000,
        mediaBudget: 5000,
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.balance.expectedRevenue).toBe(10000);
      expect(isFinite(scenarios.balance.requiredROAS)).toBe(true);
    });

    test('Hanterar hög vinstmarginal (cap at 90%)', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.80, // 80% mål
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 80,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      // maxProfit ska inte överstiga 90%
      expect(scenarios.maxProfit.achievedProfitMargin).toBeLessThanOrEqual(0.90);
    });

    test('Hanterar låg vinstmarginal', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.05, // 5% mål
        economics: baseEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...baseEconomics,
        desiredProfitMargin: 5,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.balance.achievedProfitMargin).toBe(0.05);
      expect(scenarios.maxProfit.achievedProfitMargin).toBeCloseTo(0.0625, 2); // 5% × 1.25
    });
  });

  // ============================================
  // UPDATE SCENARIO RECOMMENDATIONS
  // ============================================

  describe('updateScenarioRecommendations', () => {

    test('Achievable → Balance rekommenderas', () => {
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

      const baseScenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      const updated = updateScenarioRecommendations(baseScenarios, 'achievable');

      expect(updated.balance.isRecommended).toBe(true);
      expect(updated.maxRevenue.isRecommended).toBe(false);
      expect(updated.maxProfit.isRecommended).toBe(false);
    });

    test('Tight → MaxProfit rekommenderas', () => {
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

      const baseScenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      const updated = updateScenarioRecommendations(baseScenarios, 'tight');

      expect(updated.maxProfit.isRecommended).toBe(true);
      expect(updated.balance.isRecommended).toBe(false);
      expect(updated.maxRevenue.isRecommended).toBe(false);
    });

    test('Impossible → MaxRevenue rekommenderas', () => {
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

      const baseScenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      const updated = updateScenarioRecommendations(baseScenarios, 'impossible');

      expect(updated.maxRevenue.isRecommended).toBe(true);
      expect(updated.balance.isRecommended).toBe(false);
      expect(updated.maxProfit.isRecommended).toBe(false);
    });

    test('Muterar inte original-scenarion', () => {
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

      const baseScenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      const originalBalanceRecommended = baseScenarios.balance.isRecommended;

      updateScenarioRecommendations(baseScenarios, 'impossible');

      // Original ska vara oförändrad
      expect(baseScenarios.balance.isRecommended).toBe(originalBalanceRecommended);
    });
  });

  // ============================================
  // SCENARIO LABELS OCH REASONING
  // ============================================

  describe('Scenario labels och reasoning', () => {

    test('Balance har korrekta labels', () => {
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.balance.name).toBe('balance');
      expect(scenarios.balance.label).toBe('Balanserad');
      expect(scenarios.balance.reasoning).toContain('Optimal balans');
      expect(scenarios.balance.reasoning).toContain('target ROAS');
    });

    test('MaxRevenue har korrekta labels', () => {
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.maxRevenue.name).toBe('maxRevenue');
      expect(scenarios.maxRevenue.label).toBe('Maximera omsättning');
      expect(scenarios.maxRevenue.reasoning).toContain('Högsta möjliga omsättning');
    });

    test('MaxProfit har korrekta labels', () => {
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
        forwardResult.netProfitPerOrder
      );

      expect(scenarios.maxProfit.name).toBe('maxProfit');
      expect(scenarios.maxProfit.label).toBe('Maximera vinst');
      expect(scenarios.maxProfit.reasoning).toContain('Högsta vinstmarginal');
    });
  });

  // ============================================
  // REALISTISKA SCENARION
  // ============================================

  describe('Realistiska kundscenarier', () => {

    test('E-commerce med standard parametrar', () => {
      const ecommerceEconomics: CalculatorInput = {
        aov: 800,
        industry: 'ecommerce',
        grossMargin: 55,
        returnRate: 8,
        shippingCost: 49,
        paymentFee: 2.5,
      };

      const input: ReverseInputs = {
        revenueTarget: 5000000,
        mediaBudget: 1000000,
        profitMarginGoal: 0.15,
        economics: ecommerceEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...ecommerceEconomics,
        desiredProfitMargin: 15,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      // Alla scenarion ska ha rimliga värden
      expect(scenarios.balance.recommendedBudget).toBeGreaterThan(0);
      expect(scenarios.balance.expectedRevenue).toBe(5000000);
      expect(scenarios.balance.requiredROAS).toBeGreaterThan(1);
      expect(scenarios.balance.requiredCOS).toBeGreaterThan(0);
      expect(scenarios.balance.requiredCOS).toBeLessThan(100);
    });

    test('SaaS med hög marginal', () => {
      const saasEconomics: CalculatorInput = {
        aov: 500,
        industry: 'saas',
        grossMargin: 80,
        returnRate: 5,
        shippingCost: 0,
        paymentFee: 2.5,
      };

      const input: ReverseInputs = {
        revenueTarget: 2000000,
        mediaBudget: 1000000,
        profitMarginGoal: 0.30,
        economics: saasEconomics,
      };

      const forwardResult = calculateBreakEven({
        ...saasEconomics,
        desiredProfitMargin: 30,
      });

      const scenarios = generateScenarios(
        input,
        forwardResult.targetRoas,
        forwardResult.netProfitPerOrder
      );

      // Med hög marginal ska ROAS-kravet vara lägre
      expect(scenarios.balance.requiredROAS).toBeLessThan(3);
    });
  });
});
