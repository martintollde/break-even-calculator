import { generatePitchScript } from './pitch-templates';
import { ReverseInputs, ReverseOutputs, ReverseScenario, ClientContext } from './types';

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

function createTestScenario(name: 'balance' | 'maxRevenue' | 'maxProfit'): ReverseScenario {
  return {
    name,
    label: name === 'balance' ? 'Balanserad' : name === 'maxRevenue' ? 'Maximera omsättning' : 'Maximera vinst',
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
    isRecommended: name === 'balance',
    reasoning: 'Test reasoning',
  };
}

function createTestOutputs(status: 'achievable' | 'tight' | 'impossible'): ReverseOutputs {
  return {
    requiredROAS: status === 'achievable' ? 3.0 : status === 'tight' ? 5.0 : 1.5,
    requiredCOS: 10.0,
    breakEvenROAS: 2.67,
    targetROAS: 3.33,
    status,
    statusMessage: 'Test',
    statusDetails: 'Test details',
    scenarios: {
      balance: createTestScenario('balance'),
      maxRevenue: createTestScenario('maxRevenue'),
      maxProfit: createTestScenario('maxProfit'),
    },
  };
}

function createFullContext(): ClientContext {
  return {
    companyName: 'TestAB',
    industry: 'fashion',
    companySize: 'smb',
    decisionMakerRole: 'cmo',
    currentAdSpend: 500000,
    currentROAS: 3.5,
  };
}

// ============================================
// ALL STATUS BRANCHES
// ============================================

describe('generatePitchScript', () => {
  describe('achievable status', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('generates all 5 script sections', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toBeTruthy();
      expect(script.problem).toBeTruthy();
      expect(script.solution).toBeTruthy();
      expect(script.objectionHandling.length).toBeGreaterThan(0);
      expect(script.closing).toBeTruthy();
    });

    test('uses optimistic tone in opening', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toContain('tillväxtmöjlighet');
    });

    test('includes formatted revenue in solution', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.solution).toContain('10');
      expect(script.solution).toContain('kr');
    });

    test('has at least 3 objection handlers', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.objectionHandling.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('tight status', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('tight');

    test('generates all 5 script sections', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toBeTruthy();
      expect(script.problem).toBeTruthy();
      expect(script.solution).toBeTruthy();
      expect(script.objectionHandling.length).toBeGreaterThan(0);
      expect(script.closing).toBeTruthy();
    });

    test('uses pragmatic tone in opening', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toContain('ambitiöst');
    });

    test('mentions optimization in solution', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.solution).toContain('marginal');
    });
  });

  describe('impossible status', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('impossible');

    test('generates all 5 script sections', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toBeTruthy();
      expect(script.problem).toBeTruthy();
      expect(script.solution).toBeTruthy();
      expect(script.objectionHandling.length).toBeGreaterThan(0);
      expect(script.closing).toBeTruthy();
    });

    test('uses consultative tone in opening', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toContain('transparenta');
    });

    test('recommends strategic adjustment in solution', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.solution).toContain('stegvis');
    });
  });

  // ============================================
  // CLIENT CONTEXT TESTS
  // ============================================

  describe('with full ClientContext', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');
    const context = createFullContext();

    test('uses company name in script', () => {
      const script = generatePitchScript(inputs, outputs, 'balance', context);
      expect(script.opening).toContain('TestAB');
      expect(script.closing).toContain('TestAB');
    });

    test('uses CMO role greeting', () => {
      const script = generatePitchScript(inputs, outputs, 'balance', context);
      expect(script.opening).toContain('marknadschef');
    });

    test('uses company size context', () => {
      const script = generatePitchScript(inputs, outputs, 'balance', context);
      expect(script.problem).toContain('storlek');
    });
  });

  describe('with minimal ClientContext', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('uses default greeting without context', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toContain('Hej!');
    });

    test('uses "ert företag" as default company name', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.opening).toContain('ert företag');
    });
  });

  describe('with CEO role', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('uses CEO-specific greeting', () => {
      const context: ClientContext = { industry: 'ecommerce', decisionMakerRole: 'ceo' };
      const script = generatePitchScript(inputs, outputs, 'balance', context);
      expect(script.opening).toContain('VD');
    });
  });

  describe('with marketingManager role', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('uses marketing manager greeting', () => {
      const context: ClientContext = { industry: 'ecommerce', decisionMakerRole: 'marketingManager' };
      const script = generatePitchScript(inputs, outputs, 'balance', context);
      expect(script.opening).toContain('marknadsansvarig');
    });
  });

  // ============================================
  // FORMATTED VALUES IN OUTPUT
  // ============================================

  describe('formatted values', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('ROAS value appears in solution', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      expect(script.solution).toContain('4.0');
    });

    test('break-even ROAS appears in objection handling', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      const allObjections = script.objectionHandling.join(' ');
      expect(allObjections).toContain('2.7');
    });
  });

  // ============================================
  // DIFFERENT SCENARIOS
  // ============================================

  describe('different scenario selection', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('generates script for maxRevenue scenario', () => {
      const script = generatePitchScript(inputs, outputs, 'maxRevenue');
      expect(script.opening).toBeTruthy();
      expect(script.solution).toBeTruthy();
    });

    test('generates script for maxProfit scenario', () => {
      const script = generatePitchScript(inputs, outputs, 'maxProfit');
      expect(script.opening).toBeTruthy();
      expect(script.solution).toBeTruthy();
    });
  });

  // ============================================
  // SWEDISH TEXT VERIFICATION
  // ============================================

  describe('Swedish text content', () => {
    const inputs = createTestInputs();
    const outputs = createTestOutputs('achievable');

    test('contains Swedish keywords', () => {
      const script = generatePitchScript(inputs, outputs, 'balance');
      const allText = [
        script.opening,
        script.problem,
        script.solution,
        ...script.objectionHandling,
        script.closing,
      ].join(' ');

      // Check for common Swedish words
      expect(allText).toMatch(/kr/);
      expect(allText).toMatch(/ROAS/);
      expect(allText).toMatch(/(omsättning|intäkt|vinst|marginal)/i);
    });
  });
});
