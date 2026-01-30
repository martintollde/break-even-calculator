import { CalculatorInput, CalculatorOutput, Industry, industryLabels } from './types';

export function formatNumber(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return '—';
  return value.toLocaleString('sv-SE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(value: number): string {
  if (!isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('sv-SE')} SEK`;
}

export function generateShareUrl(inputs: CalculatorInput): string {
  const params = new URLSearchParams();
  params.set('aov', String(inputs.aov));
  params.set('industry', inputs.industry);
  if (inputs.productCost !== undefined) params.set('pc', String(inputs.productCost));
  if (inputs.grossMargin !== undefined) params.set('gm', String(inputs.grossMargin));
  if (inputs.returnRate !== undefined) params.set('rr', String(inputs.returnRate));
  if (inputs.shippingCostType === 'percent' && inputs.shippingCostPercent !== undefined) {
    params.set('sct', 'percent');
    params.set('scp', String(inputs.shippingCostPercent));
  } else if (inputs.shippingCost !== undefined) {
    params.set('sc', String(inputs.shippingCost));
  }
  if (inputs.paymentFee !== undefined) params.set('pf', String(inputs.paymentFee));
  if (inputs.ltvMultiplier !== undefined) params.set('ltv', String(inputs.ltvMultiplier));
  if (inputs.desiredProfitMargin !== undefined) params.set('dpm', String(inputs.desiredProfitMargin));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function parseShareUrl(searchParams: URLSearchParams): Partial<CalculatorInput> | null {
  const aov = searchParams.get('aov');
  if (!aov) return null;

  const result: Partial<CalculatorInput> = {
    aov: Number(aov),
    industry: (searchParams.get('industry') as Industry) || 'ecommerce',
  };

  const pc = searchParams.get('pc');
  if (pc) result.productCost = Number(pc);
  const gm = searchParams.get('gm');
  if (gm) result.grossMargin = Number(gm);
  const rr = searchParams.get('rr');
  if (rr) result.returnRate = Number(rr);
  const sct = searchParams.get('sct');
  if (sct === 'percent') {
    result.shippingCostType = 'percent';
    const scp = searchParams.get('scp');
    if (scp) result.shippingCostPercent = Number(scp);
  } else {
    const sc = searchParams.get('sc');
    if (sc) {
      result.shippingCost = Number(sc);
      result.shippingCostType = 'fixed';
    }
  }
  const pf = searchParams.get('pf');
  if (pf) result.paymentFee = Number(pf);
  const ltv = searchParams.get('ltv');
  if (ltv) result.ltvMultiplier = Number(ltv);
  const dpm = searchParams.get('dpm');
  if (dpm) result.desiredProfitMargin = Number(dpm);

  return result;
}

export function generateCopyText(inputs: CalculatorInput, outputs: CalculatorOutput): string {
  const lines = [
    '═══ BREAK-EVEN ROAS KALKYL ═══',
    '',
    `Bransch: ${industryLabels[inputs.industry]}`,
    `AOV: ${formatCurrency(inputs.aov)}`,
    '',
    '── Resultat (ROAS) ──',
    `Break-even ROAS: ${formatNumber(outputs.breakEvenRoas)}x`,
    `Target ROAS (${outputs.desiredProfitMargin}% vinst): ${formatNumber(outputs.targetRoas)}x`,
    '',
    '── Resultat (COS) ──',
    `Break-even COS: ${formatNumber(outputs.breakEvenCos)}%`,
    `Target COS (${outputs.desiredProfitMargin}% vinst): ${formatNumber(outputs.targetCos)}%`,
    `Max CPA: ${formatCurrency(outputs.maxCpa)}`,
    `Max CPA (med LTV): ${formatCurrency(outputs.maxCpaWithLtv)}`,
    `Break-even ROAS (med LTV): ${formatNumber(outputs.breakEvenRoasWithLtv)}x`,
    '',
    '── Antaganden ──',
    ...outputs.assumptions.map(a => {
      const source = a.source === 'user' ? 'egna data' : 'branschsnitt';
      let val: string;
      if (a.displayValue) {
        val = a.displayValue;
      } else if (a.parameter === 'Fraktkostnad') {
        val = `${a.value} SEK`;
      } else if (a.parameter === 'LTV-multiplikator') {
        val = `${a.value}x`;
      } else {
        val = `${(a.value * 100).toFixed(1)}%`;
      }
      return `• ${a.parameter}: ${val} (${source})`;
    }),
    '',
    `Precision: ${outputs.confidenceLevel === 'high' ? 'Hög' : outputs.confidenceLevel === 'medium' ? 'Medium' : 'Låg'}`,
  ];
  return lines.join('\n');
}
