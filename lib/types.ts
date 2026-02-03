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
  ltvMode?: boolean; // default false = "First-purchase ROAS"
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
  unitEconomics: import('./unit-economics').UnitEconomics;
  contributionBeforeAds: number;
  contributionRate: number;
  targetImpossible: boolean;
  ltvMode: boolean;
}

/**
 * Sparad scenario för jämförelse i framåt-kalkylatorn.
 * Används för att spara och jämföra olika beräkningar.
 */
export interface SavedScenario {
  id: string;
  name: string;
  inputs: CalculatorInput;
  outputs: CalculatorOutput;
}

/** @deprecated Använd SavedScenario istället */
export type Scenario = SavedScenario;

export const industryLabels: Record<Industry, string> = {
  ecommerce: 'E-commerce (generellt)',
  fashion: 'Fashion & Kläder',
  beauty: 'Beauty & Hudvård',
  electronics: 'Elektronik',
  homeGarden: 'Hem & Trädgård',
  saas: 'SaaS / Digital',
  other: 'Övrigt',
};

// ============================================
// PITCH SCRIPT GENERATOR TYPES
// ============================================

export interface ClientContext {
  companyName?: string;
  industry: Industry;
  companySize?: 'startup' | 'smb' | 'enterprise';
  decisionMakerRole?: 'ceo' | 'cmo' | 'marketingManager' | 'other';
  currentAdSpend?: number;
  currentROAS?: number;
}

export interface PitchScript {
  opening: string;
  problem: string;
  solution: string;
  objectionHandling: string[];
  closing: string;
}

export interface PitchEnhanceRequest {
  script: PitchScript;
  context: ClientContext;
  reverseInputs: ReverseInputs;
  reverseOutputs: ReverseOutputs;
  selectedScenario: ScenarioName;
}

// ============================================
// ROI SIMULATOR TYPES
// ============================================

export type ROICase = 'worst' | 'expected' | 'best';

export interface MonthlyProjection {
  month: number;
  label: string;
  revenue: number;
  adSpend: number;
  profit: number;
  cumulativeProfit: number;
  cumulativeRevenue: number;
}

export interface ROISimulation {
  ifWeDo: MonthlyProjection[];
  ifWeWait: MonthlyProjection[];
  totalRevenueDelta: number;
  totalProfitDelta: number;
  breakEvenMonth: number;
  roi12Month: number;
}

export interface ROISimulationConfig {
  case: ROICase;
  rampUpMonths: number;
  variancePercent: number;
}

// ============================================
// REVERSE CALCULATOR TYPES
// ============================================

/**
 * Läge för kalkylatorn.
 * - 'forward': Beräkna ROAS/COS utifrån ekonomiska parametrar
 * - 'reverse': Beräkna krav utifrån affärsmål
 */
export type CalculatorMode = 'forward' | 'reverse';

/**
 * Indata för bakåt-kalkylatorn.
 * Användaren anger affärsmål och kalkylatorn beräknar vad som krävs.
 */
export interface ReverseInputs {
  /** Intäktsmål i SEK (t.ex. 1000000 för 1 MSEK) */
  revenueTarget: number;

  /** Mediabudget i SEK */
  mediaBudget: number;

  /** Önskad vinstmarginal som decimal (t.ex. 0.20 för 20%) */
  profitMarginGoal: number;

  /** Ekonomiska parametrar från framåt-kalkylatorn */
  economics: CalculatorInput;

  /** Procent av intäktsmål som minsta acceptabla revenue (70-100) för scenario 3 */
  minRevenuePercent?: number;
}

/**
 * Scenariotyp för bakåt-kalkylatorn.
 * - 'budgetForTarget': Budget krävd för att nå revenue target med önskad marginal
 * - 'maxRevenueGivenBudget': Max revenue givet nuvarande budget och target ROAS
 * - 'maxProfitGivenMinRevenue': Max vinst givet minsta acceptabla revenue
 */
export type ScenarioName = 'budgetForTarget' | 'maxRevenueGivenBudget' | 'maxProfitGivenMinRevenue';

/**
 * Ett scenario i bakåt-kalkylatorn.
 * Representerar en möjlig strategi för att nå affärsmålen.
 */
export interface ReverseScenario {
  /** Scenariotyp */
  name: ScenarioName;

  /** Visningsnamn på svenska */
  label: string;

  /** Rekommenderad mediabudget i SEK */
  recommendedBudget: number;

  /** Förväntad intäkt i SEK */
  expectedRevenue: number;

  /** ROAS som krävs för att nå målet */
  requiredROAS: number;

  /** COS som krävs för att nå målet (i procent) */
  requiredCOS: number;

  /** Uppnådd vinstmarginal som decimal */
  achievedProfitMargin: number;

  /** Skillnad mot ursprunglig budget i SEK */
  budgetDelta: number;

  /** Skillnad mot ursprunglig budget i procent */
  budgetDeltaPercent: number;

  /** Skillnad mot intäktsmål i SEK */
  revenueDelta: number;

  /** Skillnad mot intäktsmål i procent */
  revenueDeltaPercent: number;

  /** Skillnad i vinst jämfört med break-even i SEK */
  profitDelta: number;

  /** Om detta scenario rekommenderas */
  isRecommended: boolean;

  /** Förklaring till varför scenariot ser ut som det gör */
  reasoning: string;
}

/**
 * Uppsättning av scenarion för bakåt-kalkylatorn.
 * Tre distinkta analyser.
 */
export interface ScenarioSet {
  /** Budget krävd för att nå revenue target med önskad marginal */
  budgetForTarget: ReverseScenario;

  /** Max revenue givet nuvarande budget och target ROAS */
  maxRevenueGivenBudget: ReverseScenario;

  /** Max vinst givet minsta acceptabla revenue */
  maxProfitGivenMinRevenue: ReverseScenario;
}

/**
 * Status för om ett mål är uppnåeligt.
 * - 'achievable': Målet kan nås med rimliga förutsättningar
 * - 'tight': Målet är svårt men möjligt
 * - 'impossible': Målet kan inte nås med givna förutsättningar
 */
export type GoalStatus = 'achievable' | 'tight' | 'impossible';

/**
 * Utdata från bakåt-kalkylatorn.
 * Innehåller beräknade krav och scenarion för att nå affärsmålen.
 */
export interface ReverseOutputs {
  /** ROAS som krävs för att nå intäktsmålet med given budget */
  requiredROAS: number;

  /** COS som krävs för att nå intäktsmålet (i procent) */
  requiredCOS: number;

  /** Break-even ROAS baserat på ekonomiska parametrar */
  breakEvenROAS: number;

  /** Target ROAS för önskad vinstmarginal */
  targetROAS: number;

  /** Status för om målet är uppnåeligt */
  status: GoalStatus;

  /** Kort statusmeddelande på svenska */
  statusMessage: string;

  /** Detaljerad förklaring av statusen */
  statusDetails: string;

  /** Scenarion med olika strategier */
  scenarios: ScenarioSet;
}
