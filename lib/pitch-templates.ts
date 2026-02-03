import {
  ReverseInputs,
  ReverseOutputs,
  ScenarioName,
  ClientContext,
  PitchScript,
  industryLabels,
} from './types';
import { formatCurrency, formatPercentNoSign } from './scenarios';

/**
 * Generates a Swedish pitch script based on reverse calculator data.
 * Templates vary by GoalStatus for appropriate tone.
 */
export function generatePitchScript(
  inputs: ReverseInputs,
  outputs: ReverseOutputs,
  selectedScenario: ScenarioName,
  context?: ClientContext
): PitchScript {
  const scenario = outputs.scenarios[selectedScenario];
  const companyName = context?.companyName || 'ert företag';
  const industryName = industryLabels[context?.industry || inputs.economics.industry];

  const revenueFormatted = formatCurrency(inputs.revenueTarget);
  const budgetFormatted = formatCurrency(scenario.recommendedBudget);
  const roasFormatted = scenario.requiredROAS.toFixed(1);
  const marginFormatted = formatPercentNoSign(scenario.achievedProfitMargin);
  const profitFormatted = formatCurrency(scenario.profitDelta);

  switch (outputs.status) {
    case 'achievable':
      return generateAchievableScript({
        companyName,
        industryName,
        revenueFormatted,
        budgetFormatted,
        roasFormatted,
        marginFormatted,
        profitFormatted,
        context,
        inputs,
        outputs,
        scenario: selectedScenario,
      });

    case 'tight':
      return generateTightScript({
        companyName,
        industryName,
        revenueFormatted,
        budgetFormatted,
        roasFormatted,
        marginFormatted,
        profitFormatted,
        context,
        inputs,
        outputs,
        scenario: selectedScenario,
      });

    case 'impossible':
      return generateImpossibleScript({
        companyName,
        industryName,
        revenueFormatted,
        budgetFormatted,
        roasFormatted,
        marginFormatted,
        profitFormatted,
        context,
        inputs,
        outputs,
        scenario: selectedScenario,
      });
  }
}

// ============================================
// TEMPLATE DATA
// ============================================

interface TemplateData {
  companyName: string;
  industryName: string;
  revenueFormatted: string;
  budgetFormatted: string;
  roasFormatted: string;
  marginFormatted: string;
  profitFormatted: string;
  context?: ClientContext;
  inputs: ReverseInputs;
  outputs: ReverseOutputs;
  scenario: ScenarioName;
}

// ============================================
// ACHIEVABLE TEMPLATES
// ============================================

function generateAchievableScript(data: TemplateData): PitchScript {
  const roleGreeting = getRoleGreeting(data.context?.decisionMakerRole);
  const sizeContext = getSizeContext(data.context?.companySize);

  return {
    opening: `${roleGreeting} Vi har analyserat möjligheterna för ${data.companyName} inom ${data.industryName} och ser en tydlig tillväxtmöjlighet. Med rätt strategi kan ni nå ${data.revenueFormatted} i omsättning med god lönsamhet.`,

    problem: `Många företag${sizeContext} investerar antingen för lite i paid media och missar tillväxt, eller för mycket utan att förstå sin break-even. Utan en datadriven approach riskerar man att antingen stagnera eller bränna budget utan avkastning.`,

    solution: `Vår analys visar att ${data.companyName} kan nå intäktsmålet på ${data.revenueFormatted} med en mediabudget på ${data.budgetFormatted}. Det kräver en ROAS på ${data.roasFormatted}x, vilket är fullt realistiskt inom ${data.industryName}. Ni uppnår en vinstmarginal på ${data.marginFormatted} och en beräknad vinst på ${data.profitFormatted}.`,

    objectionHandling: [
      `"Det är för dyrt" - Med en break-even ROAS på ${data.outputs.breakEvenROAS.toFixed(1)}x och ett target på ${data.roasFormatted}x har ni god marginal. Varje krona ni investerar genererar ${data.roasFormatted} kronor tillbaka.`,
      `"Vi har provat paid media förut utan resultat" - Skillnaden ligger i datadriven optimering. Vi jobbar mot konkreta KPI:er: ROAS ${data.roasFormatted}x och max CPA som säkerställer lönsamhet per order.`,
      `"Kan vi börja mindre?" - Absolut. Vi kan skala upp stegvis och bevisa konceptet med en lägre initial budget. Resultaten är linjärt skalbara.`,
    ],

    closing: `Med dessa siffror i ryggen har ${data.companyName} en tydlig väg till lönsam tillväxt. Jag föreslår att vi bokar ett uppföljningsmöte där vi går igenom en detaljerad kampanjplan anpassad för er.`,
  };
}

// ============================================
// TIGHT TEMPLATES
// ============================================

function generateTightScript(data: TemplateData): PitchScript {
  const roleGreeting = getRoleGreeting(data.context?.decisionMakerRole);
  const sizeContext = getSizeContext(data.context?.companySize);

  return {
    opening: `${roleGreeting} Vi har gjort en grundlig analys av möjligheterna för ${data.companyName} inom ${data.industryName}. Målet är ambitiöst men genomförbart med rätt optimering.`,

    problem: `Utmaningen för företag${sizeContext} i ${data.industryName} är att hitta balansen mellan tillväxt och lönsamhet. Ert intäktsmål kräver en ROAS på ${data.outputs.requiredROAS.toFixed(1)}x, vilket är över det optimala ${data.outputs.targetROAS.toFixed(1)}x men fortfarande inom räckhåll.`,

    solution: `Genom att fokusera på marginaloptimering rekommenderar vi en strategi med mediabudget på ${data.budgetFormatted}. Med en ROAS på ${data.roasFormatted}x uppnår ni en starkare vinstmarginal på ${data.marginFormatted}. Vinsten beräknas till ${data.profitFormatted}. Nyckeln är att prioritera lönsamhet per order framför volym.`,

    objectionHandling: [
      `"ROAS-kravet verkar högt" - Vi rekommenderar därför en marginalfokuserad strategi som sänker ROAS-kravet genom att optimera för högre ordervärden och bättre konverteringsgrad.`,
      `"Kan vi nå intäktsmålet ändå?" - Med nuvarande marginalstruktur rekommenderar vi att antingen justera intäktsmålet eller förbättra bruttomarginalen. Vi kan hjälpa med båda.`,
      `"Vad händer om vi inte når målen?" - Vi sätter upp tydliga milstolpar och justerar löpande. Break-even ligger på ${data.outputs.breakEvenROAS.toFixed(1)}x ROAS, så ni har skyddsnät.`,
    ],

    closing: `${data.companyName} har potential att växa lönsamt, men det kräver en fokuserad strategi. Låt oss ta nästa steg och sätta upp en pilotperiod där vi validerar siffrorna i praktiken.`,
  };
}

// ============================================
// IMPOSSIBLE TEMPLATES
// ============================================

function generateImpossibleScript(data: TemplateData): PitchScript {
  const roleGreeting = getRoleGreeting(data.context?.decisionMakerRole);
  const sizeContext = getSizeContext(data.context?.companySize);

  return {
    opening: `${roleGreeting} Vi har analyserat förutsättningarna för ${data.companyName} och vill vara transparenta med vad som är möjligt. Vi ser stor potential men rekommenderar en justerad strategi.`,

    problem: `Utmaningen för företag${sizeContext} inom ${data.industryName} är att intäktsmålet på ${formatCurrency(data.inputs.revenueTarget)} ligger över vad som är lönsamt att uppnå enbart via paid media. ROAS-kravet på ${data.outputs.requiredROAS.toFixed(1)}x överstiger break-even på ${data.outputs.breakEvenROAS.toFixed(1)}x, vilket innebär att varje extra krona i ad spend minskar er marginal.`,

    solution: `Vi rekommenderar en stegvis approach: Börja med en mediabudget på ${data.budgetFormatted} fokuserad på lönsamma segment. Parallellt arbetar vi med att förbättra konverteringsgraden och ordervärdet. Med en ROAS på ${data.roasFormatted}x och marginal på ${data.marginFormatted} bygger vi en lönsam bas att skala från.`,

    objectionHandling: [
      `"Vi behöver nå intäktsmålet" - Vi rekommenderar att dela upp det: en del via paid media (lönsam tillväxt) och en del via organisk tillväxt och CRM. Paid media bör alltid vara lönsamt.`,
      `"Konkurrenterna spenderar mer" - Att spendera mer utan lönsamhet urholkar er position. Vår approach bygger långsiktig, skalbar tillväxt.`,
      `"Kan ni garantera resultat?" - Vi kan garantera transparens och datadriven optimering. Med break-even på ${data.outputs.breakEvenROAS.toFixed(1)}x ROAS sätter vi tydliga gränser.`,
    ],

    closing: `Istället för att jaga ett orealistiskt mål föreslår vi att ${data.companyName} bygger en lönsam bas först. Vi tar gärna ett möte där vi presenterar en realistisk tillväxtplan med tydliga milstolpar.`,
  };
}

// ============================================
// HELPERS
// ============================================

function getRoleGreeting(role?: ClientContext['decisionMakerRole']): string {
  switch (role) {
    case 'ceo':
      return 'Som VD förstår du vikten av lönsam tillväxt.';
    case 'cmo':
      return 'Som marknadschef vet du att varje investering måste bära sig.';
    case 'marketingManager':
      return 'Som marknadsansvarig ser du dagligen behovet av mätbara resultat.';
    default:
      return 'Hej!';
  }
}

function getSizeContext(size?: ClientContext['companySize']): string {
  switch (size) {
    case 'startup':
      return ' i uppstartsfas';
    case 'smb':
      return ' i er storlek';
    case 'enterprise':
      return ' i enterprise-segmentet';
    default:
      return '';
  }
}
