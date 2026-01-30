import { Industry, IndustryDefaults } from './types';

export const industryDefaults: Record<Industry, IndustryDefaults> = {
  ecommerce: {
    margin: 0.50,
    returnRate: 0.08,
    paymentFee: 0.025,
    ltvMultiplier: 1.3,
    shippingCost: 49,
  },
  fashion: {
    margin: 0.55,
    returnRate: 0.25,
    paymentFee: 0.025,
    ltvMultiplier: 1.4,
    shippingCost: 0,
  },
  beauty: {
    margin: 0.65,
    returnRate: 0.05,
    paymentFee: 0.025,
    ltvMultiplier: 1.8,
    shippingCost: 29,
  },
  electronics: {
    margin: 0.25,
    returnRate: 0.10,
    paymentFee: 0.025,
    ltvMultiplier: 1.1,
    shippingCost: 0,
  },
  homeGarden: {
    margin: 0.45,
    returnRate: 0.08,
    paymentFee: 0.025,
    ltvMultiplier: 1.2,
    shippingCost: 99,
  },
  saas: {
    margin: 0.80,
    returnRate: 0.05,
    paymentFee: 0.025,
    ltvMultiplier: 3.0,
    shippingCost: 0,
  },
  other: {
    margin: 0.50,
    returnRate: 0.08,
    paymentFee: 0.025,
    ltvMultiplier: 1.3,
    shippingCost: 49,
  },
};

export const tooltips = {
  aov: 'Snittordervärde (Average Order Value) – genomsnittligt belopp per order. Hittas i e-handelsplattformen eller Google Analytics.',
  productCost: 'Inköpskostnad för produkterna i en genomsnittlig order. Inkluderar inköpspris men ej frakt eller personal.',
  grossMargin: 'Andelen av försäljningspriset som är bruttovinst. Exempel: produkt säljs för 1000 kr, kostar 400 kr = 60% marginal.',
  returnRate: 'Andel av orders som returneras. Fashion har ofta 20–30%, elektronik ca 10%.',
  shippingCost: 'Din fraktkostnad per order. Kan anges som fast belopp (SEK) eller som procent av ordervärdet. Procent är användbart när fraktkostnaden skalas med orderstorlek.',
  paymentFee: 'Avgift till betalleverantör (Klarna, Stripe, etc). Typiskt 2–3% av ordervärdet.',
  ltvMultiplier: 'Hur många gånger en genomsnittlig kund handlar totalt. 1.3x betyder att kunden i snitt gör 1.3 köp.',
  desiredProfitMargin: 'Önskad vinstmarginal efter annonskostnad. 20% betyder att 20% av nettovinsten ska bli kvar som profit efter ad spend. Högre marginal = högre Target ROAS krävs.',
  breakEvenRoas: 'Return On Ad Spend där annonskostnaden = vinsten. Under detta värde förlorar ni pengar på varje order.',
  targetRoas: 'ROAS som behövs för att nå önskad vinstmarginal efter annonskostnad.',
  maxCpa: 'Högsta kostnad per förvärv (Cost Per Acquisition) där ni fortfarande går break-even.',
  maxCpaLtv: 'Max CPA om ni räknar in kundens livstidsvärde – tillåter högre förvärvskostnad för återkommande kunder.',
  breakEvenCos: 'Högsta tillåtna COS (Cost of Sale) för att gå break-even. Över detta värde förlorar ni pengar.',
  targetCos: 'COS som behövs för att nå önskad vinstmarginal. Sikta på att hålla er under detta värde.',
};
