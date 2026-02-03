/**
 * Historical Calibration: CSV input, OLS regression, quality assessment.
 *
 * Fits ln(roas) = a + b * ln(spend) using OLS.
 * No external dependencies.
 */

import { CalibratedVolumeConfig } from './volume-model';

// ============================================
// INTERFACES
// ============================================

export interface HistoricalDataPoint {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
}

export type FitQuality = 'low' | 'medium' | 'high';

export interface RegressionResult {
  a: number;
  b: number;
  rSquared: number;
  n: number;
  fitQuality: FitQuality;
  interpretation: string;
  config: CalibratedVolumeConfig;
  predictedRoas: (spend: number) => number;
}

// ============================================
// CSV PARSING
// ============================================

/**
 * Parse CSV text into data points.
 * Accepts comma, semicolon, or tab separators.
 * Columns: date, spend, revenue OR date, spend, roas.
 * Auto-detects 2-col vs 3-col (excluding date).
 */
export function parseCSV(csv: string): HistoricalDataPoint[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Detect separator
  const firstDataLine = lines.length > 1 ? lines[1] : lines[0];
  let separator: string;
  if (firstDataLine.includes('\t')) separator = '\t';
  else if (firstDataLine.includes(';')) separator = ';';
  else separator = ',';

  // Check if first line is header
  const firstCells = lines[0].split(separator).map(c => c.trim());
  const isHeader = firstCells.some(c =>
    /^(date|datum|spend|budget|revenue|omsättning|roas|intäkt)/i.test(c)
  );

  const dataLines = isHeader ? lines.slice(1) : lines;
  const results: HistoricalDataPoint[] = [];

  // Detect column layout from header or first data line
  let hasRevenue = true;
  if (isHeader) {
    const headerLower = firstCells.map(c => c.toLowerCase());
    hasRevenue = headerLower.some(h => /revenue|omsättning|intäkt/.test(h));
  }

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const cells = line.split(separator).map(c => c.trim().replace(/\s/g, ''));
    if (cells.length < 2) continue;

    // Parse numbers, handling Swedish decimal comma
    const parseNum = (s: string) => Number(s.replace(',', '.'));

    let date: string;
    let spend: number;
    let revenue: number;
    let roas: number;

    if (cells.length >= 4) {
      // date, spend, revenue, roas (all provided)
      date = cells[0];
      spend = parseNum(cells[1]);
      revenue = parseNum(cells[2]);
      roas = parseNum(cells[3]);
    } else if (cells.length === 3) {
      date = cells[0];
      spend = parseNum(cells[1]);
      const thirdVal = parseNum(cells[2]);

      if (hasRevenue || thirdVal > 100) {
        // Third column is revenue
        revenue = thirdVal;
        roas = spend > 0 ? revenue / spend : 0;
      } else {
        // Third column is ROAS
        roas = thirdVal;
        revenue = spend * roas;
      }
    } else {
      // 2 columns: spend, revenue (no date)
      date = '';
      spend = parseNum(cells[0]);
      revenue = parseNum(cells[1]);
      roas = spend > 0 ? revenue / spend : 0;
    }

    if (spend > 0 && (revenue > 0 || roas > 0)) {
      results.push({
        date: date || `Row ${results.length + 1}`,
        spend,
        revenue: revenue || spend * roas,
        roas: roas || (spend > 0 ? revenue / spend : 0),
      });
    }
  }

  return results;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate data for regression.
 * Requires minimum 5 data points, all positive spend/roas.
 */
export function validateData(
  data: HistoricalDataPoint[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length < 5) {
    errors.push(`Minst 5 datapunkter krävs (har ${data.length}).`);
  }

  const invalidSpend = data.filter(d => d.spend <= 0);
  if (invalidSpend.length > 0) {
    errors.push(`${invalidSpend.length} rad(er) har ogiltigt spendvärde.`);
  }

  const invalidRoas = data.filter(d => d.roas <= 0);
  if (invalidRoas.length > 0) {
    errors.push(`${invalidRoas.length} rad(er) har ogiltigt ROAS-värde.`);
  }

  // Check for all same spend values (would make regression meaningless)
  const uniqueSpends = new Set(data.map(d => d.spend));
  if (uniqueSpends.size < 2 && data.length >= 2) {
    errors.push('Alla datapunkter har samma spendvärde. Variation krävs för regression.');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// OLS REGRESSION
// ============================================

/**
 * Run OLS regression: ln(roas) = a + b * ln(spend).
 *
 * No external libraries. Direct calculation of coefficients.
 *
 * @returns RegressionResult or null if data is insufficient.
 */
export function runOLS(data: HistoricalDataPoint[]): RegressionResult | null {
  const validation = validateData(data);
  if (!validation.valid) return null;

  const n = data.length;
  const X = data.map(d => Math.log(d.spend));
  const Y = data.map(d => Math.log(d.roas));

  const sumX = X.reduce((s, v) => s + v, 0);
  const sumY = Y.reduce((s, v) => s + v, 0);
  const sumXY = X.reduce((s, v, i) => s + v * Y[i], 0);
  const sumX2 = X.reduce((s, v) => s + v * v, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  // OLS coefficients
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = meanY - b * meanX;

  // R² calculation
  const ssTot = Y.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const ssRes = Y.reduce((s, y, i) => {
    const yHat = a + b * X[i];
    return s + (y - yHat) ** 2;
  }, 0);

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Fit quality
  let fitQuality: FitQuality;
  if (rSquared > 0.7) fitQuality = 'high';
  else if (rSquared > 0.3) fitQuality = 'medium';
  else fitQuality = 'low';

  // Swedish interpretation of b
  const interpretation = interpretSlope(b);

  const config: CalibratedVolumeConfig = { a, b };

  return {
    a,
    b,
    rSquared,
    n,
    fitQuality,
    interpretation,
    config,
    predictedRoas: (spend: number) => {
      if (spend <= 0) return 0;
      return Math.exp(a) * Math.pow(spend, b);
    },
  };
}

/**
 * Swedish interpretation of the slope coefficient b.
 */
function interpretSlope(b: number): string {
  if (b > -0.05 && b < 0.05) {
    return 'ROAS är stabil oavsett budget. Inga tydliga avtagande effekter.';
  }
  if (b >= -0.3) {
    return 'Lätt avtagande avkastning. Normal för de flesta annonskanaler.';
  }
  if (b >= -0.6) {
    return 'Normal avtagande avkastning. Budget bör optimeras noggrant.';
  }
  return 'Stark avtagande effekt. Ökning av budget ger snabbt minskad ROAS.';
}
