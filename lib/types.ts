export type Industry = 'ecommerce' | 'fashion' | 'beauty' | 'electronics' | 'homeGarden' | 'saas' | 'other';

export interface IndustryDefaults {
  margin: number;
  returnRate: number;
  paymentFee: number;
  ltvMultiplier: number;
  shippingCost: number;
}

export interface CalculatorInput {
  aov: number;
  industry: Industry;
  productCost?: number;
  grossMargin?: number;
  returnRate?: number;
  shippingCost?: number;
  shippingCostPercent?: number;
  shippingCostType?: 'fixed' | 'percent';
  paymentFee?: number;
  ltvMultiplier?: number;
  desiredProfitMargin?: number;
}

export interface Assumption {
  parameter: string;
  value: number;
  displayValue?: string;
  source: 'user' | 'industry_default';
}

export type ViewMode = 'roas' | 'cos';

export interface CalculatorOutput {
  breakEvenRoas: number;
  targetRoas: number;
  breakEvenCos: number;
  targetCos: number;
  desiredProfitMargin: number;
  maxCpa: number;
  maxCpaWithLtv: number;
  breakEvenRoasWithLtv: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  assumptions: Assumption[];
  netProfitPerOrder: number;
}

export interface Scenario {
  id: string;
  name: string;
  inputs: CalculatorInput;
  outputs: CalculatorOutput;
}

export const industryLabels: Record<Industry, string> = {
  ecommerce: 'E-commerce (generellt)',
  fashion: 'Fashion & Kläder',
  beauty: 'Beauty & Hudvård',
  electronics: 'Elektronik',
  homeGarden: 'Hem & Trädgård',
  saas: 'SaaS / Digital',
  other: 'Övrigt',
};
