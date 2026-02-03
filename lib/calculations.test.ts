import {
  calculateBreakEven,
  calculateReverse,
  determineStatus,
  getStatusMessages,
} from './calculations';
import { CalculatorInput, ReverseInputs } from './types';

describe('Break-even Calculator - Beräkningsverifiering', () => {

  // ============================================
  // GRUNDLÄGGANDE BERÄKNINGAR
  // New formula: returns increase cost, not reduce revenue
  // productCostEffective = productCost * (1 + returnRate)
  // contribution = AOV - (productCostEffective + shipping + paymentFee)
  // ============================================

  describe('Grundläggande break-even beräkning', () => {

    test('Scenario 1: Enkel beräkning utan returer eller frakt', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // productCost = 500, effective = 500 * 1.0 = 500
      // contribution = 1000 - 500 = 500
      // breakEvenRoas = 1000 / 500 = 2.0
      expect(result.breakEvenRoas).toBeCloseTo(2.0, 2);
      expect(result.maxCpa).toBeCloseTo(500, 2);
      expect(result.contributionBeforeAds).toBeCloseTo(500, 2);
    });

    test('Scenario 2: Med produktkostnad istället för marginal', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        productCost: 600,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // productCost = 600, effective = 600
      // contribution = 1000 - 600 = 400
      // breakEvenRoas = 1000 / 400 = 2.5
      expect(result.breakEvenRoas).toBeCloseTo(2.5, 2);
      expect(result.maxCpa).toBeCloseTo(400, 2);
    });

    test('Scenario 3: Med payment fee', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 2.5,
      };

      const result = calculateBreakEven(input);

      // contribution = 1000 - (500 + 0 + 25) = 475
      // breakEvenRoas = 1000 / 475 = 2.105
      expect(result.breakEvenRoas).toBeCloseTo(2.105, 2);
      expect(result.maxCpa).toBeCloseTo(475, 2);
    });

    test('Scenario 4: Med fraktkostnad', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 49,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // contribution = 1000 - (500 + 49 + 0) = 451
      // breakEvenRoas = 1000 / 451 = 2.217
      expect(result.breakEvenRoas).toBeCloseTo(2.217, 2);
      expect(result.maxCpa).toBeCloseTo(451, 2);
    });

    test('Scenario 5: Med returgrad (new formula: cost increases)', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 10,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // productCost = 500, effective = 500 * 1.10 = 550
      // contribution = 1000 - 550 = 450
      // breakEvenRoas = 1000 / 450 = 2.222
      expect(result.breakEvenRoas).toBeCloseTo(2.222, 2);
      expect(result.maxCpa).toBeCloseTo(450, 2);
    });

    test('Scenario 6: Komplett beräkning med alla faktorer', () => {
      const input: CalculatorInput = {
        aov: 1200,
        industry: 'ecommerce',
        grossMargin: 55,
        returnRate: 8,
        shippingCost: 59,
        paymentFee: 2.5,
        ltvMultiplier: 1.4,
        desiredProfitMargin: 25,
      };

      const result = calculateBreakEven(input);

      // productCost = 1200 * 0.45 = 540
      // productCostEffective = 540 * 1.08 = 583.20
      // paymentFee = 1200 * 0.025 = 30
      // contribution = 1200 - (583.20 + 59 + 30) = 527.80
      expect(result.contributionBeforeAds).toBeCloseTo(527.80, 1);

      // breakEvenRoas = 1200 / 527.80 = 2.273
      expect(result.breakEvenRoas).toBeCloseTo(2.273, 2);
      expect(result.maxCpa).toBeCloseTo(527.80, 1);

      // Max CPA med LTV = 527.80 * 1.4 = 738.92
      expect(result.maxCpaWithLtv).toBeCloseTo(738.92, 1);

      // Target ROAS (25% of AOV semantics)
      // maxAdCostTarget = 527.80 - 1200 * 0.25 = 527.80 - 300 = 227.80
      // targetRoas = 1200 / 227.80 = 5.267
      expect(result.targetRoas).toBeCloseTo(5.267, 2);
    });
  });

  // ============================================
  // COS-BERÄKNINGAR
  // ============================================

  describe('COS (Cost of Sale) beräkningar', () => {

    test('COS är korrekt inverterad från ROAS', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      expect(result.breakEvenRoas).toBeCloseTo(2.0, 2);
      expect(result.breakEvenCos).toBeCloseTo(50, 2);
      expect(result.breakEvenCos).toBeCloseTo((1 / result.breakEvenRoas) * 100, 2);
    });

    test('COS-konverteringar för vanliga ROAS-värden', () => {
      const conversions = [
        { roas: 2.0, expectedCos: 50.0 },
        { roas: 2.5, expectedCos: 40.0 },
        { roas: 3.0, expectedCos: 33.33 },
        { roas: 4.0, expectedCos: 25.0 },
        { roas: 5.0, expectedCos: 20.0 },
        { roas: 8.0, expectedCos: 12.5 },
        { roas: 10.0, expectedCos: 10.0 },
      ];

      conversions.forEach(({ roas, expectedCos }) => {
        const cos = (1 / roas) * 100;
        expect(cos).toBeCloseTo(expectedCos, 1);
      });
    });
  });

  // ============================================
  // TARGET ROAS MED ÖNSKAD VINSTMARGINAL
  // New semantics: desiredMargin is % of AOV
  // targetRoas = AOV / (contribution - AOV * desiredMargin)
  // ============================================

  describe('Target ROAS med önskad vinstmarginal (% av AOV)', () => {

    test('Target ROAS 10% av AOV', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
        desiredProfitMargin: 10,
      };

      const result = calculateBreakEven(input);

      // contribution = 500
      // maxAdCost = 500 - 1000 * 0.10 = 400
      // targetRoas = 1000 / 400 = 2.5
      expect(result.targetRoas).toBeCloseTo(2.5, 2);
    });

    test('Target ROAS 20% av AOV', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
        desiredProfitMargin: 20,
      };

      const result = calculateBreakEven(input);

      // maxAdCost = 500 - 200 = 300
      // targetRoas = 1000 / 300 = 3.333
      expect(result.targetRoas).toBeCloseTo(3.333, 2);
    });

    test('Target ROAS 30% av AOV', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
        desiredProfitMargin: 30,
      };

      const result = calculateBreakEven(input);

      // maxAdCost = 500 - 300 = 200
      // targetRoas = 1000 / 200 = 5.0
      expect(result.targetRoas).toBeCloseTo(5.0, 2);
    });

    test('Target ROAS 0% vinstmarginal = Break-even', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
        desiredProfitMargin: 0,
      };

      const result = calculateBreakEven(input);

      expect(result.targetRoas).toBeCloseTo(result.breakEvenRoas, 2);
    });

    test('Target impossible when margin >= contribution rate', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 20, // contribution = 200, rate = 20%
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
        desiredProfitMargin: 25, // 25% of AOV = 250 > 200
      };

      const result = calculateBreakEven(input);

      expect(result.targetImpossible).toBe(true);
      expect(result.targetRoas).toBe(Infinity);
    });
  });

  // ============================================
  // BRANSCH-DEFAULTS
  // ============================================

  describe('Bransch-defaults används korrekt', () => {

    test('E-commerce defaults', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'ecommerce',
      };

      const result = calculateBreakEven(input);

      // E-commerce: margin 50%, return 8%, payment 2.5%, shipping 49
      // productCost = 500, effective = 500 * 1.08 = 540
      // paymentFee = 25
      // contribution = 1000 - (540 + 49 + 25) = 386
      // breakEvenRoas = 1000 / 386 = 2.591
      expect(result.breakEvenRoas).toBeCloseTo(2.591, 2);

      expect(result.assumptions.some(a =>
        a.parameter === 'Bruttomarginal' && a.source === 'industry_default'
      )).toBe(true);
    });

    test('Fashion defaults (hög returgrad)', () => {
      const input: CalculatorInput = {
        aov: 800,
        industry: 'fashion',
      };

      const result = calculateBreakEven(input);

      // Fashion: margin 55%, return 25%, payment 2.5%, shipping 0
      // productCost = 800 * 0.45 = 360
      // effective = 360 * 1.25 = 450
      // paymentFee = 800 * 0.025 = 20
      // contribution = 800 - (450 + 0 + 20) = 330
      // breakEvenRoas = 800 / 330 = 2.424
      expect(result.breakEvenRoas).toBeCloseTo(2.424, 2);
    });

    test('SaaS defaults (hög marginal, hög LTV)', () => {
      const input: CalculatorInput = {
        aov: 500,
        industry: 'saas',
      };

      const result = calculateBreakEven(input);

      // SaaS: margin 80%, return 5%, payment 2.5%, shipping 0, LTV 3.0
      // productCost = 500 * 0.20 = 100
      // effective = 100 * 1.05 = 105
      // paymentFee = 500 * 0.025 = 12.5
      // contribution = 500 - (105 + 0 + 12.5) = 382.5
      // breakEvenRoas = 500 / 382.5 = 1.307
      expect(result.breakEvenRoas).toBeCloseTo(1.307, 2);

      // Max CPA med LTV = 382.5 * 3.0 = 1147.5
      expect(result.maxCpaWithLtv).toBeCloseTo(1147.5, 1);
    });

    test('User input överskrider defaults', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'ecommerce',
        grossMargin: 60,
        returnRate: 5,
      };

      const result = calculateBreakEven(input);

      // User: margin 60%, return 5%
      // productCost = 400, effective = 400 * 1.05 = 420
      // paymentFee = 25 (default)
      // shipping = 49 (default)
      // contribution = 1000 - (420 + 49 + 25) = 506
      // breakEvenRoas = 1000 / 506 = 1.976
      expect(result.breakEvenRoas).toBeCloseTo(1.976, 2);

      expect(result.assumptions.some(a =>
        a.parameter === 'Bruttomarginal' && a.source === 'user'
      )).toBe(true);
    });
  });

  // ============================================
  // FRAKTKOSTNAD SOM PROCENT
  // ============================================

  describe('Fraktkostnad som procent av AOV', () => {

    test('Fraktkostnad som procent beräknas korrekt', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCostType: 'percent',
        shippingCostPercent: 5,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // contribution = 1000 - (500 + 50 + 0) = 450
      // breakEvenRoas = 1000 / 450 = 2.222
      expect(result.breakEvenRoas).toBeCloseTo(2.222, 2);
    });

    test('Fraktkostnad procent skalas med AOV', () => {
      const inputLowAov: CalculatorInput = {
        aov: 500,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCostType: 'percent',
        shippingCostPercent: 10,
        paymentFee: 0,
      };

      const inputHighAov: CalculatorInput = {
        aov: 2000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCostType: 'percent',
        shippingCostPercent: 10,
        paymentFee: 0,
      };

      const resultLow = calculateBreakEven(inputLowAov);
      const resultHigh = calculateBreakEven(inputHighAov);

      // Same ROAS requirement since all costs are proportional
      expect(resultLow.breakEvenRoas).toBeCloseTo(resultHigh.breakEvenRoas, 2);
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge cases och validering', () => {

    test('Låg marginal ger hög break-even ROAS', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 20,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // contribution = 1000 - 800 = 200
      // breakEvenRoas = 1000 / 200 = 5.0
      expect(result.breakEvenRoas).toBeCloseTo(5.0, 2);
    });

    test('Hög marginal ger låg break-even ROAS', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 80,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // contribution = 1000 - 200 = 800
      // breakEvenRoas = 1000 / 800 = 1.25
      expect(result.breakEvenRoas).toBeCloseTo(1.25, 2);
    });

    test('Hög returgrad påverkar kraftigt', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 30,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // productCost = 500, effective = 500 * 1.30 = 650
      // contribution = 1000 - 650 = 350
      // breakEvenRoas = 1000 / 350 = 2.857
      expect(result.breakEvenRoas).toBeCloseTo(2.857, 2);
    });

    test('Fraktkostnad nära marginal ger mycket hög ROAS', () => {
      const input: CalculatorInput = {
        aov: 200,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 80,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // contribution = 200 - (100 + 80) = 20
      // breakEvenRoas = 200 / 20 = 10.0
      expect(result.breakEvenRoas).toBeCloseTo(10.0, 2);
    });

    test('Negativ nettovinst ger Infinity ROAS', () => {
      const input: CalculatorInput = {
        aov: 200,
        industry: 'other',
        grossMargin: 20,
        returnRate: 0,
        shippingCost: 50,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // contribution = 200 - (160 + 50) = -10
      expect(result.breakEvenRoas).toBe(Infinity);
    });

    test('Confidence level baserat på antal user inputs', () => {
      const lowConfidence = calculateBreakEven({
        aov: 1000,
        industry: 'other',
      });
      expect(lowConfidence.confidenceLevel).toBe('low');

      const mediumConfidence = calculateBreakEven({
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 10,
      });
      expect(mediumConfidence.confidenceLevel).toBe('medium');

      const highConfidence = calculateBreakEven({
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 10,
        shippingCost: 49,
        paymentFee: 2.5,
      });
      expect(highConfidence.confidenceLevel).toBe('high');
    });

    test('New output fields are populated', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      expect(result.unitEconomics).toBeDefined();
      expect(result.contributionBeforeAds).toBeCloseTo(500, 2);
      expect(result.contributionRate).toBeCloseTo(0.5, 4);
      expect(result.targetImpossible).toBe(false);
      expect(result.ltvMode).toBe(false);
    });
  });

  // ============================================
  // REALISTISKA KUNDSCENARIER
  // ============================================

  describe('Realistiska kundscenarier', () => {

    test('Scenario: Klädbutik online', () => {
      const input: CalculatorInput = {
        aov: 899,
        industry: 'fashion',
        grossMargin: 58,
        returnRate: 22,
        shippingCost: 0,
        paymentFee: 2.9,
        ltvMultiplier: 1.5,
        desiredProfitMargin: 15,
      };

      const result = calculateBreakEven(input);

      // productCost = 899 * 0.42 = 377.58
      // effective = 377.58 * 1.22 = 460.6476
      // paymentFee = 899 * 0.029 = 26.071
      // contribution = 899 - (460.6476 + 0 + 26.071) = 412.2814
      expect(result.contributionBeforeAds).toBeCloseTo(412.28, 0);
      // breakEvenRoas = 899 / 412.28 = 2.181
      expect(result.breakEvenRoas).toBeCloseTo(2.181, 1);
    });

    test('Scenario: Kosmetika med hög LTV', () => {
      const input: CalculatorInput = {
        aov: 450,
        industry: 'beauty',
        grossMargin: 68,
        returnRate: 3,
        shippingCost: 29,
        paymentFee: 2.5,
        ltvMultiplier: 2.2,
        desiredProfitMargin: 20,
      };

      const result = calculateBreakEven(input);

      // productCost = 450 * 0.32 = 144
      // effective = 144 * 1.03 = 148.32
      // paymentFee = 450 * 0.025 = 11.25
      // contribution = 450 - (148.32 + 29 + 11.25) = 261.43
      expect(result.contributionBeforeAds).toBeCloseTo(261.43, 0);
      expect(result.maxCpa).toBeCloseTo(261.43, 0);

      // Max CPA med LTV = 261.43 * 2.2 = 575.15
      expect(result.maxCpaWithLtv).toBeCloseTo(575.15, 0);
    });

    test('Scenario: Elektronik med låg marginal', () => {
      const input: CalculatorInput = {
        aov: 4500,
        industry: 'electronics',
        grossMargin: 18,
        returnRate: 8,
        shippingCost: 0,
        paymentFee: 1.8,
        desiredProfitMargin: 10,
      };

      const result = calculateBreakEven(input);

      // productCost = 4500 * 0.82 = 3690
      // effective = 3690 * 1.08 = 3985.20
      // paymentFee = 4500 * 0.018 = 81
      // contribution = 4500 - (3985.20 + 0 + 81) = 433.80
      expect(result.contributionBeforeAds).toBeCloseTo(433.80, 0);
      // breakEvenRoas = 4500 / 433.80 = 10.374
      expect(result.breakEvenRoas).toBeCloseTo(10.374, 1);
    });
  });
});

// ============================================
// REVERSE CALCULATOR TESTS
// ============================================

describe('Reverse Calculator - Bakåtberäkning', () => {

  const baseEconomics: CalculatorInput = {
    aov: 1000,
    industry: 'other',
    grossMargin: 50,
    returnRate: 0,
    shippingCost: 0,
    paymentFee: 0,
  };

  // ============================================
  // DETERMINE STATUS - NEW 3-RULE LOGIC
  // required < breakEven -> achievable
  // breakEven <= required < target -> tight
  // required >= target -> impossible
  // ============================================

  describe('determineStatus - Ny 3-reglers logik', () => {

    test('Achievable: requiredROAS under breakEvenROAS', () => {
      // required = 1.5 < breakeven = 2.0
      const status = determineStatus(1.5, 2.0, 3.333);
      expect(status).toBe('achievable');
    });

    test('Tight: requiredROAS exakt lika med breakEvenROAS', () => {
      // required = 2.0 >= breakeven = 2.0 (tight zone starts at breakeven)
      const status = determineStatus(2.0, 2.0, 3.333);
      expect(status).toBe('tight');
    });

    test('Tight: requiredROAS mellan breakEven och target', () => {
      const status = determineStatus(2.5, 2.0, 3.333);
      expect(status).toBe('tight');
    });

    test('Impossible: requiredROAS exakt lika med targetROAS', () => {
      // required = 3.333 >= target = 3.333
      const status = determineStatus(3.333, 2.0, 3.333);
      expect(status).toBe('impossible');
    });

    test('Impossible: requiredROAS över targetROAS', () => {
      const status = determineStatus(5.0, 2.0, 3.333);
      expect(status).toBe('impossible');
    });

    test('Achievable: Mycket låg required ROAS', () => {
      const status = determineStatus(0.5, 2.0, 3.333);
      expect(status).toBe('achievable');
    });
  });

  // ============================================
  // GET STATUS MESSAGES
  // ============================================

  describe('getStatusMessages - Statusmeddelanden', () => {

    test('Achievable: Returnerar rätt meddelande', () => {
      const { statusMessage, statusDetails } = getStatusMessages('achievable', 1.5, 2.0, 3.333);

      expect(statusMessage).toBe('✅ Lönsamhet möjlig');
      expect(statusDetails).toContain('1.50x ROAS');
      expect(statusDetails).toContain('under break-even');
    });

    test('Tight: Returnerar rätt meddelande', () => {
      const { statusMessage, statusDetails } = getStatusMessages('tight', 2.5, 2.0, 3.333);

      expect(statusMessage).toBe('⚠️ Möjligt men kräver optimering');
      expect(statusDetails).toContain('2.50x ROAS');
      expect(statusDetails).toContain('mellan break-even');
    });

    test('Impossible: Returnerar rätt meddelande', () => {
      const { statusMessage, statusDetails } = getStatusMessages('impossible', 5.0, 2.0, 3.333);

      expect(statusMessage).toBe('❌ Underfinansierat / för högt mål');
      expect(statusDetails).toContain('5.00x ROAS');
      expect(statusDetails).toContain('överstiger target');
    });
  });

  // ============================================
  // CALCULATE REVERSE - GRUNDLÄGGANDE
  // ============================================

  describe('calculateReverse - Grundläggande beräkningar', () => {

    test('Beräknar korrekt required ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      expect(result.requiredROAS).toBeCloseTo(4.0, 2);
    });

    test('Beräknar korrekt required COS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      expect(result.requiredCOS).toBeCloseTo(25.0, 2);
    });

    test('Återanvänder framåt-beräkning för break-even ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      // contribution = 500, breakEven = 1000/500 = 2.0
      expect(result.breakEvenROAS).toBeCloseTo(2.0, 2);
    });

    test('Återanvänder framåt-beräkning för target ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      // target = 1000 / (500 - 200) = 3.333
      expect(result.targetROAS).toBeCloseTo(3.333, 2);
    });
  });

  // ============================================
  // CALCULATE REVERSE - STATUS
  // ============================================

  describe('calculateReverse - Statusbestämning', () => {

    test('Status achievable: Budget generös (required < breakEven)', () => {
      const input: ReverseInputs = {
        revenueTarget: 300000,
        mediaBudget: 250000,  // required ROAS = 1.2 < breakEven 2.0
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('achievable');
    });

    test('Status tight: required between breakEven and target', () => {
      const input: ReverseInputs = {
        revenueTarget: 750000,
        mediaBudget: 250000,  // required ROAS = 3.0, between 2.0 and 3.333
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('tight');
    });

    test('Status impossible: required >= target', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,  // required ROAS = 4.0 >= target 3.333
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('impossible');
    });
  });

  // ============================================
  // SCENARIOS STRUCTURE
  // ============================================

  describe('calculateReverse - Scenarios', () => {

    test('Genererar tre nya scenarion', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      expect(result.scenarios.budgetForTarget).toBeDefined();
      expect(result.scenarios.maxRevenueGivenBudget).toBeDefined();
      expect(result.scenarios.maxProfitGivenMinRevenue).toBeDefined();
    });
  });

  // ============================================
  // VALIDERING
  // ============================================

  describe('calculateReverse - Validering', () => {

    test('Kastar fel vid negativt intäktsmål', () => {
      const input: ReverseInputs = {
        revenueTarget: -100000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      expect(() => calculateReverse(input)).toThrow('Intäktsmålet måste vara större än 0');
    });

    test('Kastar fel vid noll mediabudget', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 0,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      expect(() => calculateReverse(input)).toThrow('Mediabudgeten måste vara större än 0');
    });

    test('Kastar fel vid ogiltig vinstmarginal (>1)', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 1.5,
        economics: baseEconomics,
      };

      expect(() => calculateReverse(input)).toThrow('Vinstmarginalen måste vara mellan 0 och 1');
    });

    test('Kastar fel vid negativ vinstmarginal', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: -0.10,
        economics: baseEconomics,
      };

      expect(() => calculateReverse(input)).toThrow('Vinstmarginalen måste vara mellan 0 och 1');
    });

    test('Kastar fel vid noll AOV', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,
        economics: { ...baseEconomics, aov: 0 },
      };

      expect(() => calculateReverse(input)).toThrow('AOV måste vara större än 0');
    });
  });

  // ============================================
  // ROUND-TRIP VERIFIERING
  // ============================================

  describe('Round-trip verifiering', () => {

    test('COS är konsekvent invers av ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 200000,
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      expect(result.requiredCOS).toBeCloseTo((1 / result.requiredROAS) * 100, 2);
    });
  });
});
