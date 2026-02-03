import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PitchEnhanceRequest, PitchScript, industryLabels } from '@/lib/types';
import { formatCurrency, formatPercentNoSign } from '@/lib/scenarios';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY är inte konfigurerad. Kontakta administratören.' },
      { status: 500 }
    );
  }

  let body: PitchEnhanceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Ogiltig request body' },
      { status: 400 }
    );
  }

  const { script, context, reverseInputs, reverseOutputs, selectedScenario } = body;

  if (!script || !reverseInputs || !reverseOutputs) {
    return NextResponse.json(
      { error: 'Saknar obligatoriska fält: script, reverseInputs, reverseOutputs' },
      { status: 400 }
    );
  }

  const scenario = reverseOutputs.scenarios[selectedScenario];
  const industryName = industryLabels[context?.industry || reverseInputs.economics.industry];

  const systemPrompt = `Du är en erfaren svensk säljkonsult som specialiserar sig på digital marknadsföring och paid media.
Din uppgift är att förbättra ett säljscript baserat på faktiska kalkyldata.

VIKTIGT:
- Skriv ALLT på svenska
- Behåll alla siffror och KPI:er exakt som de är - de kommer från kalkylatorn
- Gör texten mer engagerande, personlig och övertygande
- Lägg till specifika branschinsikter för ${industryName}
- Använd en professionell men varm ton
- Strukturen ska vara: opening, problem, solution, objectionHandling (array), closing
- Svara ENBART med giltig JSON i formatet: {"opening": "...", "problem": "...", "solution": "...", "objectionHandling": ["...", "...", "..."], "closing": "..."}

KALKYLDATA:
- Bransch: ${industryName}
- Intäktsmål: ${formatCurrency(reverseInputs.revenueTarget)}
- Mediabudget: ${formatCurrency(scenario.recommendedBudget)}
- ROAS-krav: ${scenario.requiredROAS.toFixed(1)}x
- Break-even ROAS: ${reverseOutputs.breakEvenROAS.toFixed(1)}x
- Vinstmarginal: ${formatPercentNoSign(scenario.achievedProfitMargin)}
- Beräknad vinst: ${formatCurrency(scenario.profitDelta)}
- Status: ${reverseOutputs.status}
${context?.companyName ? `- Företag: ${context.companyName}` : ''}
${context?.companySize ? `- Storlek: ${context.companySize}` : ''}
${context?.decisionMakerRole ? `- Beslutsfattare: ${context.decisionMakerRole}` : ''}`;

  const userPrompt = `Förbättra detta säljscript. Behåll alla siffror exakt men gör det mer engagerande och övertygande:

ÖPPNING:
${script.opening}

PROBLEM:
${script.problem}

LÖSNING:
${script.solution}

INVÄNDNINGSHANTERING:
${script.objectionHandling.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

AVSLUTNING:
${script.closing}

Svara ENBART med giltig JSON.`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      system: systemPrompt,
    });

    // Extract text from response
    const textBlock = message.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'Tomt svar från AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let enhancedScript: PitchScript;
    try {
      enhancedScript = JSON.parse(textBlock.text);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = textBlock.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        enhancedScript = JSON.parse(jsonMatch[1]);
      } else {
        return NextResponse.json(
          { error: 'Kunde inte tolka AI-svaret' },
          { status: 500 }
        );
      }
    }

    // Validate structure
    if (!enhancedScript.opening || !enhancedScript.problem || !enhancedScript.solution ||
        !Array.isArray(enhancedScript.objectionHandling) || !enhancedScript.closing) {
      return NextResponse.json(
        { error: 'AI returnerade ofullständigt script' },
        { status: 500 }
      );
    }

    return NextResponse.json(enhancedScript);
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json(
      { error: 'Kunde inte kontakta AI-tjänsten. Försök igen.' },
      { status: 500 }
    );
  }
}
