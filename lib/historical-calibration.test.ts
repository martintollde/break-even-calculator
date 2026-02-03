import {
  parseCSV,
  validateData,
  runOLS,
  HistoricalDataPoint,
} from './historical-calibration';

// ============================================
// CSV PARSING TESTS
// ============================================

describe('Historical Calibration - parseCSV', () => {
  test('parses 3-column CSV with header (date, spend, revenue)', () => {
    const csv = `date,spend,revenue
2024-01,50000,200000
2024-02,60000,228000
2024-03,70000,252000
2024-04,80000,272000
2024-05,90000,288000`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(5);
    expect(data[0].spend).toBe(50000);
    expect(data[0].revenue).toBe(200000);
    expect(data[0].roas).toBeCloseTo(4.0, 2);
  });

  test('parses 3-column CSV with ROAS column', () => {
    const csv = `date,spend,roas
2024-01,50000,4.0
2024-02,60000,3.8
2024-03,70000,3.6
2024-04,80000,3.4
2024-05,90000,3.2`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(5);
    expect(data[0].roas).toBe(4.0);
    expect(data[0].revenue).toBeCloseTo(200000, 0);
  });

  test('parses semicolon-separated CSV', () => {
    const csv = `datum;spend;revenue
2024-01;50000;200000
2024-02;60000;228000
2024-03;70000;252000
2024-04;80000;272000
2024-05;90000;288000`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(5);
    expect(data[0].spend).toBe(50000);
  });

  test('parses tab-separated data', () => {
    const csv = `date\tspend\trevenue
2024-01\t50000\t200000
2024-02\t60000\t228000
2024-03\t70000\t252000
2024-04\t80000\t272000
2024-05\t90000\t288000`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(5);
  });

  test('parses 2-column data without date', () => {
    const csv = `50000,200000
60000,228000
70000,252000
80000,272000
90000,288000`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(5);
    expect(data[0].spend).toBe(50000);
    expect(data[0].revenue).toBe(200000);
  });

  test('handles Swedish decimal comma', () => {
    const csv = `date;spend;roas
2024-01;50000;4,0
2024-02;60000;3,8
2024-03;70000;3,6
2024-04;80000;3,4
2024-05;90000;3,2`;

    const data = parseCSV(csv);
    expect(data[0].roas).toBe(4.0);
    expect(data[1].roas).toBe(3.8);
  });

  test('skips empty lines', () => {
    const csv = `date,spend,revenue
2024-01,50000,200000

2024-02,60000,228000

2024-03,70000,252000
2024-04,80000,272000
2024-05,90000,288000`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(5);
  });

  test('returns empty array for empty input', () => {
    expect(parseCSV('')).toHaveLength(0);
  });

  test('skips rows with zero spend', () => {
    const csv = `date,spend,revenue
2024-01,0,0
2024-02,60000,228000
2024-03,70000,252000`;

    const data = parseCSV(csv);
    expect(data).toHaveLength(2);
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

describe('Historical Calibration - validateData', () => {
  function makeData(n: number): HistoricalDataPoint[] {
    return Array.from({ length: n }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, '0')}`,
      spend: 50000 + i * 10000,
      revenue: (50000 + i * 10000) * (4 - i * 0.1),
      roas: 4 - i * 0.1,
    }));
  }

  test('valid with 5+ data points', () => {
    const result = validateData(makeData(5));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('invalid with fewer than 5 data points', () => {
    const result = validateData(makeData(3));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('5');
  });

  test('invalid with negative spend', () => {
    const data = makeData(5);
    data[2].spend = -1000;
    const result = validateData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('spendvärde'))).toBe(true);
  });

  test('invalid with zero ROAS', () => {
    const data = makeData(5);
    data[0].roas = 0;
    const result = validateData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ROAS'))).toBe(true);
  });

  test('invalid when all spend values are identical', () => {
    const data = makeData(5).map(d => ({ ...d, spend: 50000 }));
    const result = validateData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Variation'))).toBe(true);
  });
});

// ============================================
// OLS REGRESSION TESTS
// ============================================

describe('Historical Calibration - runOLS', () => {
  test('perfect linear data gives R²=1', () => {
    // Generate data where ln(roas) = 5.0 + (-0.3) * ln(spend) exactly
    const a = 5.0;
    const b = -0.3;
    const data: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000, 100000].map(
      (spend, i) => {
        const roas = Math.exp(a) * Math.pow(spend, b);
        return {
          date: `2024-${String(i + 1).padStart(2, '0')}`,
          spend,
          revenue: spend * roas,
          roas,
        };
      }
    );

    const result = runOLS(data);
    expect(result).not.toBeNull();
    expect(result!.a).toBeCloseTo(a, 4);
    expect(result!.b).toBeCloseTo(b, 4);
    expect(result!.rSquared).toBeCloseTo(1.0, 4);
    expect(result!.fitQuality).toBe('high');
  });

  test('known diminishing returns data', () => {
    // Realistic scenario: ROAS decreases from 5 to 3 as spend doubles
    const data: HistoricalDataPoint[] = [
      { date: '2024-01', spend: 30000, revenue: 150000, roas: 5.0 },
      { date: '2024-02', spend: 50000, revenue: 225000, roas: 4.5 },
      { date: '2024-03', spend: 70000, revenue: 280000, roas: 4.0 },
      { date: '2024-04', spend: 100000, revenue: 350000, roas: 3.5 },
      { date: '2024-05', spend: 150000, revenue: 450000, roas: 3.0 },
    ];

    const result = runOLS(data);
    expect(result).not.toBeNull();
    expect(result!.b).toBeLessThan(0); // negative slope = diminishing returns
    expect(result!.rSquared).toBeGreaterThan(0.9); // should fit well
    expect(result!.n).toBe(5);
  });

  test('returns null for insufficient data', () => {
    const data: HistoricalDataPoint[] = [
      { date: '2024-01', spend: 50000, revenue: 200000, roas: 4.0 },
      { date: '2024-02', spend: 60000, revenue: 228000, roas: 3.8 },
    ];

    const result = runOLS(data);
    expect(result).toBeNull();
  });

  test('fit quality categorization', () => {
    // High R² data (perfectly correlated)
    const perfectData: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000].map(
      (spend, i) => {
        const roas = Math.exp(3.0) * Math.pow(spend, -0.2);
        return {
          date: `2024-${i + 1}`,
          spend,
          revenue: spend * roas,
          roas,
        };
      }
    );

    const highResult = runOLS(perfectData);
    expect(highResult!.fitQuality).toBe('high');
  });

  test('b interpretation for stable ROAS', () => {
    // b ≈ 0: stable ROAS
    const data: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000].map(
      (spend, i) => {
        const roas = Math.exp(1.386) * Math.pow(spend, -0.01); // b ≈ 0
        return {
          date: `2024-${i + 1}`,
          spend,
          revenue: spend * roas,
          roas,
        };
      }
    );

    const result = runOLS(data);
    expect(result!.interpretation).toContain('stabil');
  });

  test('b interpretation for strong diminishing returns', () => {
    const data: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000].map(
      (spend, i) => {
        const roas = Math.exp(10.0) * Math.pow(spend, -0.8); // strong diminishing
        return {
          date: `2024-${i + 1}`,
          spend,
          revenue: spend * roas,
          roas,
        };
      }
    );

    const result = runOLS(data);
    expect(result!.interpretation).toContain('Stark');
  });

  test('predictedRoas function works correctly', () => {
    const data: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000].map(
      (spend, i) => {
        const roas = Math.exp(3.0) * Math.pow(spend, -0.2);
        return {
          date: `2024-${i + 1}`,
          spend,
          revenue: spend * roas,
          roas,
        };
      }
    );

    const result = runOLS(data)!;
    // Predict ROAS at a known spend level
    const predicted = result.predictedRoas(75000);
    const expected = Math.exp(result.a) * Math.pow(75000, result.b);
    expect(predicted).toBeCloseTo(expected, 4);
  });

  test('predictedRoas returns 0 for non-positive spend', () => {
    const data: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000].map(
      (spend, i) => ({
        date: `2024-${i + 1}`,
        spend,
        revenue: spend * 4,
        roas: 4,
      })
    );

    const result = runOLS(data)!;
    expect(result.predictedRoas(0)).toBe(0);
    expect(result.predictedRoas(-1000)).toBe(0);
  });

  test('config object matches a and b', () => {
    const data: HistoricalDataPoint[] = [50000, 60000, 70000, 80000, 90000].map(
      (spend, i) => {
        const roas = Math.exp(3.0) * Math.pow(spend, -0.2);
        return {
          date: `2024-${i + 1}`,
          spend,
          revenue: spend * roas,
          roas,
        };
      }
    );

    const result = runOLS(data)!;
    expect(result.config.a).toBe(result.a);
    expect(result.config.b).toBe(result.b);
  });
});
