import {
  calculateBreakEven,
  calculateReverse,
  determineStatus,
  getStatusMessages,
} from './calculations';
import { generateScenarios } from './scenarios';
import { CalculatorInput, ReverseInputs } from './types';

describe('Break-even Calculator - Beräkningsverifiering', () => {

  // ============================================
  // GRUNDLÄGGANDE BERÄKNINGAR
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

      // Nettovinst per order = 1000 * 0.50 = 500 SEK
      // Break-even ROAS = AOV / Nettovinst = 1000 / 500 = 2.0
      expect(result.breakEvenRoas).toBeCloseTo(2.0, 2);
      expect(result.maxCpa).toBeCloseTo(500, 2);
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

      // Marginal = (1000 - 600) / 1000 = 40%
      // Nettovinst = 1000 * 0.40 = 400 SEK
      // Break-even ROAS = 1000 / 400 = 2.5
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

      // Nettovinst = (1000 * 0.50) - (1000 * 0.025) = 500 - 25 = 475 SEK
      // Break-even ROAS = 1000 / 475 = 2.105...
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

      // Nettovinst = 500 - 49 = 451 SEK
      // Break-even ROAS = 1000 / 451 = 2.217...
      expect(result.breakEvenRoas).toBeCloseTo(2.217, 2);
      expect(result.maxCpa).toBeCloseTo(451, 2);
    });

    test('Scenario 5: Med returgrad', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 10,
        shippingCost: 0,
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // Effektiv intäkt = 1000 * (1 - 0.10) = 900 SEK
      // Nettovinst = 900 * 0.50 = 450 SEK
      // Break-even ROAS = 1000 / 450 = 2.222...
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

      // Steg-för-steg:
      // 1. Effektiv intäkt = 1200 * (1 - 0.08) = 1104 SEK
      // 2. Bruttovinst = 1104 * 0.55 = 607.20 SEK
      // 3. Payment fee = 1200 * 0.025 = 30 SEK
      // 4. Nettovinst = 607.20 - 59 - 30 = 518.20 SEK
      // 5. Break-even ROAS = 1200 / 518.20 = 2.316...
      expect(result.breakEvenRoas).toBeCloseTo(2.316, 2);
      expect(result.maxCpa).toBeCloseTo(518.20, 1);

      // 6. Max CPA med LTV = 518.20 * 1.4 = 725.48 SEK
      expect(result.maxCpaWithLtv).toBeCloseTo(725.48, 1);

      // 7. Target ROAS (25% vinst) = 1200 / (518.20 * 0.75) = 3.088...
      expect(result.targetRoas).toBeCloseTo(3.088, 2);
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

      // ROAS 2.0 = COS 50%
      expect(result.breakEvenRoas).toBeCloseTo(2.0, 2);
      expect(result.breakEvenCos).toBeCloseTo(50, 2);

      // Verifiering: 1 / ROAS * 100 = COS
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
  // ============================================

  describe('Target ROAS med önskad vinstmarginal', () => {

    test('Target ROAS 10% vinstmarginal', () => {
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

      // Nettovinst = 500 SEK
      // Med 10% vinst behåller vi: 500 * 0.90 = 450 SEK till ads
      // Target ROAS = 1000 / 450 = 2.222...
      expect(result.targetRoas).toBeCloseTo(2.222, 2);
    });

    test('Target ROAS 20% vinstmarginal', () => {
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

      // Med 20% vinst behåller vi: 500 * 0.80 = 400 SEK till ads
      // Target ROAS = 1000 / 400 = 2.5
      expect(result.targetRoas).toBeCloseTo(2.5, 2);
    });

    test('Target ROAS 30% vinstmarginal', () => {
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

      // Med 30% vinst behåller vi: 500 * 0.70 = 350 SEK till ads
      // Target ROAS = 1000 / 350 = 2.857...
      expect(result.targetRoas).toBeCloseTo(2.857, 2);
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

      // 0% vinst = Target ROAS ska vara samma som Break-even ROAS
      expect(result.targetRoas).toBeCloseTo(result.breakEvenRoas, 2);
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

      // E-commerce defaults: margin 50%, returnRate 8%, paymentFee 2.5%, shipping 49
      // Effektiv intäkt = 1000 * 0.92 = 920
      // Bruttovinst = 920 * 0.50 = 460
      // Payment fee = 1000 * 0.025 = 25
      // Nettovinst = 460 - 49 - 25 = 386
      // Break-even ROAS = 1000 / 386 = 2.591...
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

      // Fashion defaults: margin 55%, returnRate 25%, paymentFee 2.5%, shipping 0
      // Effektiv intäkt = 800 * 0.75 = 600
      // Bruttovinst = 600 * 0.55 = 330
      // Payment fee = 800 * 0.025 = 20
      // Nettovinst = 330 - 0 - 20 = 310
      // Break-even ROAS = 800 / 310 = 2.581...
      expect(result.breakEvenRoas).toBeCloseTo(2.581, 2);
    });

    test('SaaS defaults (hög marginal, hög LTV)', () => {
      const input: CalculatorInput = {
        aov: 500,
        industry: 'saas',
      };

      const result = calculateBreakEven(input);

      // SaaS defaults: margin 80%, returnRate 5%, paymentFee 2.5%, shipping 0, LTV 3.0
      // Effektiv intäkt = 500 * 0.95 = 475
      // Bruttovinst = 475 * 0.80 = 380
      // Payment fee = 500 * 0.025 = 12.5
      // Nettovinst = 380 - 0 - 12.5 = 367.5
      // Break-even ROAS = 500 / 367.5 = 1.361...
      expect(result.breakEvenRoas).toBeCloseTo(1.361, 2);

      // Max CPA med LTV = 367.5 * 3.0 = 1102.5
      expect(result.maxCpaWithLtv).toBeCloseTo(1102.5, 1);
    });

    test('User input överskrider defaults', () => {
      const input: CalculatorInput = {
        aov: 1000,
        industry: 'ecommerce',
        grossMargin: 60,
        returnRate: 5,
      };

      const result = calculateBreakEven(input);

      // Ska använda 60% marginal och 5% returer
      // Effektiv intäkt = 1000 * 0.95 = 950
      // Bruttovinst = 950 * 0.60 = 570
      // Payment fee = 1000 * 0.025 = 25 (default)
      // Shipping = 49 (default)
      // Nettovinst = 570 - 49 - 25 = 496
      // Break-even ROAS = 1000 / 496 = 2.016...
      expect(result.breakEvenRoas).toBeCloseTo(2.016, 2);

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
        shippingCostPercent: 5, // 5% = 50 SEK vid AOV 1000
        paymentFee: 0,
      };

      const result = calculateBreakEven(input);

      // Nettovinst = 500 - 50 = 450
      // Break-even ROAS = 1000 / 450 = 2.222
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

      // Med samma marginal och samma frakt-% ska ROAS-kravet vara lika
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

      // Nettovinst = 1000 * 0.20 = 200
      // Break-even ROAS = 1000 / 200 = 5.0
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

      // Nettovinst = 1000 * 0.80 = 800
      // Break-even ROAS = 1000 / 800 = 1.25
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

      // Effektiv intäkt = 1000 * 0.70 = 700
      // Nettovinst = 700 * 0.50 = 350
      // Break-even ROAS = 1000 / 350 = 2.857...
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

      // Nettovinst = 100 - 80 = 20 SEK
      // Break-even ROAS = 200 / 20 = 10.0
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

      // Nettovinst = 40 - 50 = -10 SEK (negativ)
      expect(result.breakEvenRoas).toBe(Infinity);
    });

    test('Confidence level baserat på antal user inputs', () => {
      // Låg confidence - bara AOV
      const lowConfidence = calculateBreakEven({
        aov: 1000,
        industry: 'other',
      });
      expect(lowConfidence.confidenceLevel).toBe('low');

      // Medium confidence - AOV + marginal + returer
      const mediumConfidence = calculateBreakEven({
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 10,
      });
      expect(mediumConfidence.confidenceLevel).toBe('medium');

      // Hög confidence - många inputs
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

      // Effektiv intäkt = 899 * 0.78 = 701.22
      // Bruttovinst = 701.22 * 0.58 = 406.7076
      // Payment fee = 899 * 0.029 = 26.071
      // Nettovinst = 406.7076 - 0 - 26.071 = 380.6366
      // Break-even ROAS = 899 / 380.6366 = 2.362
      expect(result.breakEvenRoas).toBeCloseTo(2.362, 1);

      // Target ROAS (15% vinst) = 899 / (380.6366 * 0.85) = 2.779
      expect(result.targetRoas).toBeCloseTo(2.779, 1);
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

      // Effektiv intäkt = 450 * 0.97 = 436.50
      // Bruttovinst = 436.50 * 0.68 = 296.82
      // Payment fee = 450 * 0.025 = 11.25
      // Nettovinst = 296.82 - 29 - 11.25 = 256.57
      // Break-even ROAS = 450 / 256.57 = 1.754
      expect(result.breakEvenRoas).toBeCloseTo(1.754, 1);

      expect(result.maxCpa).toBeCloseTo(256.57, 0);

      // Max CPA med LTV = 256.57 * 2.2 = 564.45
      expect(result.maxCpaWithLtv).toBeCloseTo(564.45, 0);
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

      // Effektiv intäkt = 4500 * 0.92 = 4140
      // Bruttovinst = 4140 * 0.18 = 745.20
      // Payment fee = 4500 * 0.018 = 81
      // Nettovinst = 745.20 - 0 - 81 = 664.20
      // Break-even ROAS = 4500 / 664.20 = 6.776
      expect(result.breakEvenRoas).toBeCloseTo(6.776, 1);
    });
  });
});

// ============================================
// REVERSE CALCULATOR TESTS
// ============================================

describe('Reverse Calculator - Bakåtberäkning', () => {

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
  // DETERMINE STATUS
  // ============================================

  describe('determineStatus - Statusbestämning', () => {

    test('Achievable: requiredROAS under targetROAS', () => {
      // breakEven = 2.0, target = 2.5
      // required = 2.3 (under target, över breakeven)
      const status = determineStatus(2.3, 2.0, 2.5);
      expect(status).toBe('achievable');
    });

    test('Achievable: requiredROAS exakt lika med targetROAS', () => {
      const status = determineStatus(2.5, 2.0, 2.5);
      expect(status).toBe('achievable');
    });

    test('Achievable: requiredROAS exakt lika med breakEvenROAS', () => {
      const status = determineStatus(2.0, 2.0, 2.5);
      expect(status).toBe('achievable');
    });

    test('Tight: requiredROAS över targetROAS men över breakEven', () => {
      // required = 3.0 > target = 2.5 > breakeven = 2.0
      const status = determineStatus(3.0, 2.0, 2.5);
      expect(status).toBe('tight');
    });

    test('Achievable: requiredROAS under breakEvenROAS', () => {
      // required = 1.5 < breakeven = 2.0, but still under target = 2.5
      const status = determineStatus(1.5, 2.0, 2.5);
      expect(status).toBe('achievable');
    });

    test('Impossible: Mycket hög required ROAS (över 2× target)', () => {
      // required = 10.0 > target × 2 = 5.0
      const status = determineStatus(10.0, 2.0, 2.5);
      expect(status).toBe('impossible');
    });

    test('Achievable: Mycket låg required ROAS', () => {
      // required = 0.5 < target = 2.5
      const status = determineStatus(0.5, 2.0, 2.5);
      expect(status).toBe('achievable');
    });
  });

  // ============================================
  // GET STATUS MESSAGES
  // ============================================

  describe('getStatusMessages - Statusmeddelanden', () => {

    test('Achievable: Returnerar rätt meddelande', () => {
      const { statusMessage, statusDetails } = getStatusMessages('achievable', 2.3, 2.0, 2.5);

      expect(statusMessage).toBe('✅ Realistiskt uppnåeligt');
      expect(statusDetails).toContain('2.30x ROAS');
      expect(statusDetails).toContain('break-even');
      expect(statusDetails).toContain('god marginal');
    });

    test('Tight: Returnerar rätt meddelande', () => {
      const { statusMessage, statusDetails } = getStatusMessages('tight', 3.0, 2.0, 2.5);

      expect(statusMessage).toBe('⚠️ Utmanande men möjligt');
      expect(statusDetails).toContain('3.00x ROAS');
      expect(statusDetails).toContain('över targetmålet');
      expect(statusDetails).toContain('optimera aggressivt');
    });

    test('Impossible: Returnerar rätt meddelande', () => {
      const { statusMessage, statusDetails } = getStatusMessages('impossible', 10.0, 2.0, 2.5);

      expect(statusMessage).toBe('❌ Omöjligt med nuvarande ekonomi');
      expect(statusDetails).toContain('10.00x ROAS');
      expect(statusDetails).toContain('orealistiskt högt');
      expect(statusDetails).toContain('dubbla targetmålet');
    });
  });

  // ============================================
  // CALCULATE REVERSE - GRUNDLÄGGANDE
  // ============================================

  describe('calculateReverse - Grundläggande beräkningar', () => {

    test('Beräknar korrekt required ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,  // 1 MSEK
        mediaBudget: 250000,     // 250k
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      // required ROAS = 1000000 / 250000 = 4.0
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

      // required COS = (1 / 4.0) * 100 = 25%
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

      // Med 50% marginal, inga kostnader: break-even ROAS = AOV / (AOV * 0.5) = 2.0
      expect(result.breakEvenROAS).toBeCloseTo(2.0, 2);
    });

    test('Återanvänder framåt-beräkning för target ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,
        profitMarginGoal: 0.20,  // 20% vinstmarginal
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      // Med 20% vinst: target ROAS = 1000 / (500 * 0.80) = 2.5
      expect(result.targetROAS).toBeCloseTo(2.5, 2);
    });
  });

  // ============================================
  // CALCULATE REVERSE - STATUS
  // ============================================

  describe('calculateReverse - Statusbestämning', () => {

    test('Status achievable: Budget ger ROAS under target', () => {
      const input: ReverseInputs = {
        revenueTarget: 500000,
        mediaBudget: 250000,  // required ROAS = 2.0 (= break-even)
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('achievable');
    });

    test('Status tight: Budget ger ROAS över target men över break-even', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 250000,  // required ROAS = 4.0 > target 2.5
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('tight');
    });

    test('Status achievable: Budget ger ROAS under break-even (men under target)', () => {
      const input: ReverseInputs = {
        revenueTarget: 300000,
        mediaBudget: 250000,  // required ROAS = 1.2 ≤ target 2.5
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('achievable');
    });

    test('Status impossible: Mycket högt ROAS-krav (över 2× target)', () => {
      const input: ReverseInputs = {
        revenueTarget: 5000000,
        mediaBudget: 250000,  // required ROAS = 20.0 > target × 2 = 5.0
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);
      expect(result.status).toBe('impossible');
    });
  });

  // ============================================
  // GENERATE SCENARIOS
  // ============================================

  describe('generateScenarios - Scenariogenerering', () => {

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

      expect(scenarios.maxRevenue).toBeDefined();
      expect(scenarios.maxProfit).toBeDefined();
      expect(scenarios.balance).toBeDefined();
    });

    test('maxRevenue scenario använder target ROAS med önskad vinstmarginal', () => {
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

      // maxRevenue använder target ROAS (2.5) och behåller vinstmarginal
      expect(scenarios.maxRevenue.requiredROAS).toBeCloseTo(2.5, 2);
      expect(scenarios.maxRevenue.achievedProfitMargin).toBe(0.20);
      expect(scenarios.maxRevenue.label).toBe('Maximera omsättning');
    });

    test('maxProfit scenario använder 25% högre vinstmarginal', () => {
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

      // maxProfit använder 25% högre marginal: 0.20 × 1.25 = 0.25
      expect(scenarios.maxProfit.achievedProfitMargin).toBeCloseTo(0.25, 2);
      // ROAS blir högre pga högre marginal: AOV / (netProfit × (1 - 0.25))
      expect(scenarios.maxProfit.requiredROAS).toBeGreaterThan(forwardResult.targetRoas);
      expect(scenarios.maxProfit.label).toBe('Maximera vinst');
    });

    test('balance scenario använder target ROAS och full vinstmarginal', () => {
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

      // Balance använder target ROAS och når full vinstmarginal
      expect(scenarios.balance.requiredROAS).toBeCloseTo(2.5, 2);
      expect(scenarios.balance.achievedProfitMargin).toBe(0.20);
      expect(scenarios.balance.label).toBe('Balanserad');
      expect(scenarios.balance.isRecommended).toBe(true);
    });

    test('Balance scenario markeras som rekommenderat', () => {
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
        forwardResult.netProfitPerOrder
      );

      // Balance är markerat som rekommenderat som default
      expect(scenarios.balance.isRecommended).toBe(true);
      expect(scenarios.maxRevenue.isRecommended).toBe(false);
      expect(scenarios.maxProfit.isRecommended).toBe(false);
    });
  });

  // ============================================
  // CALCULATE REVERSE - VALIDERING
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
        profitMarginGoal: 1.5,  // 150% är ogiltigt
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
  // CALCULATE REVERSE - REALISTISKA SCENARION
  // ============================================

  describe('calculateReverse - Realistiska kundscenarier', () => {

    test('Scenario: E-handelsföretag med tillväxtmål', () => {
      const input: ReverseInputs = {
        revenueTarget: 5000000,   // 5 MSEK intäktsmål
        mediaBudget: 1000000,     // 1 MSEK mediabudget
        profitMarginGoal: 0.15,   // 15% vinstmarginal
        economics: {
          aov: 800,
          industry: 'ecommerce',
          grossMargin: 55,
          returnRate: 10,
          shippingCost: 49,
          paymentFee: 2.5,
        },
      };

      const result = calculateReverse(input);

      // required ROAS = 5000000 / 1000000 = 5.0
      expect(result.requiredROAS).toBeCloseTo(5.0, 2);
      expect(result.requiredCOS).toBeCloseTo(20.0, 2);

      // Verifierar att status och meddelanden finns
      expect(['achievable', 'tight', 'impossible']).toContain(result.status);
      expect(result.statusMessage).toBeTruthy();
      expect(result.statusDetails).toBeTruthy();

      // Verifierar scenarion
      expect(result.scenarios.maxRevenue).toBeDefined();
      expect(result.scenarios.maxProfit).toBeDefined();
      expect(result.scenarios.balance).toBeDefined();
    });

    test('Scenario: SaaS-företag med hög marginal', () => {
      const input: ReverseInputs = {
        revenueTarget: 2000000,
        mediaBudget: 1200000,  // Justerad för att ge achievable status
        profitMarginGoal: 0.30,  // 30% vinstmarginal
        economics: {
          aov: 500,
          industry: 'saas',
          grossMargin: 80,
          returnRate: 5,
          shippingCost: 0,
          paymentFee: 2.5,
        },
      };

      const result = calculateReverse(input);

      // required ROAS = 2000000 / 1200000 = 1.67
      expect(result.requiredROAS).toBeCloseTo(1.67, 2);

      // Med 80% marginal och låga kostnader bör break-even vara låg (~1.36)
      expect(result.breakEvenROAS).toBeLessThan(2.0);

      // Med required ROAS (1.67) under target ROAS (~1.94) bör det vara achievable
      expect(result.status).toBe('achievable');
    });

    test('Scenario: Lågmarginalprodukter - svårt att nå mål', () => {
      const input: ReverseInputs = {
        revenueTarget: 10000000,  // 10 MSEK
        mediaBudget: 1500000,     // 1.5 MSEK
        profitMarginGoal: 0.10,
        economics: {
          aov: 300,
          industry: 'electronics',
          grossMargin: 15,
          returnRate: 12,
          shippingCost: 0,
          paymentFee: 2.0,
        },
      };

      const result = calculateReverse(input);

      // required ROAS = 10000000 / 1500000 = 6.67
      expect(result.requiredROAS).toBeCloseTo(6.67, 2);

      // Med låg marginal bör break-even vara hög
      expect(result.breakEvenROAS).toBeGreaterThan(5.0);

      // Required ROAS (6.67) under target ROAS (~9.92) → achievable
      expect(result.status).toBe('achievable');
    });
  });

  // ============================================
  // ROUND-TRIP VERIFIERING
  // ============================================

  describe('Round-trip verifiering', () => {

    test('Framåt → Bakåt: Konsistenta resultat', () => {
      // Först: Kör framåt-beräkning
      const forwardInput: CalculatorInput = {
        aov: 1000,
        industry: 'other',
        grossMargin: 50,
        returnRate: 0,
        shippingCost: 0,
        paymentFee: 0,
        desiredProfitMargin: 20,
      };

      const forwardResult = calculateBreakEven(forwardInput);
      // break-even = 2.0, target = 2.5

      // Sen: Kör bakåt-beräkning med exakt target ROAS
      // Om vi vill ha ROAS 2.5 och intäkt 1000000, budget = 1000000/2.5 = 400000
      const reverseInput: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 400000,  // Ger exakt ROAS 2.5
        profitMarginGoal: 0.20,
        economics: forwardInput,
      };

      const reverseResult = calculateReverse(reverseInput);

      // Required ROAS ska matcha target ROAS
      expect(reverseResult.requiredROAS).toBeCloseTo(forwardResult.targetRoas, 2);

      // Break-even ska vara samma
      expect(reverseResult.breakEvenROAS).toBeCloseTo(forwardResult.breakEvenRoas, 2);

      // Target ska vara samma
      expect(reverseResult.targetROAS).toBeCloseTo(forwardResult.targetRoas, 2);
    });

    test('COS är konsekvent invers av ROAS', () => {
      const input: ReverseInputs = {
        revenueTarget: 1000000,
        mediaBudget: 200000,  // ROAS = 5.0
        profitMarginGoal: 0.20,
        economics: baseEconomics,
      };

      const result = calculateReverse(input);

      // COS = (1 / ROAS) * 100
      expect(result.requiredCOS).toBeCloseTo((1 / result.requiredROAS) * 100, 2);
    });
  });
});
