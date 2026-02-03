'use client';

import { useState, useCallback } from 'react';
import { MessageSquare, Copy, Sparkles, Check, User, Building2, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ReverseInputs,
  ReverseOutputs,
  ScenarioName,
  ClientContext,
  PitchScript,
} from '@/lib/types';
import { generatePitchScript } from '@/lib/pitch-templates';
import { usePitchEnhance } from '@/hooks/usePitchEnhance';

interface PitchGeneratorProps {
  reverseInputs: ReverseInputs;
  reverseOutputs: ReverseOutputs | null;
  selectedScenario: ScenarioName;
}

const companySizeLabels: Record<string, string> = {
  startup: 'Startup',
  smb: 'SMB (litet/medelstort)',
  enterprise: 'Enterprise',
};

const roleLabels: Record<string, string> = {
  ceo: 'VD',
  cmo: 'Marknadschef (CMO)',
  marketingManager: 'Marknadsansvarig',
  other: 'Annan',
};

export function PitchGenerator({ reverseInputs, reverseOutputs, selectedScenario }: PitchGeneratorProps) {
  // Client context form
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState<string>('');
  const [decisionMakerRole, setDecisionMakerRole] = useState<string>('');

  // Generated script
  const [script, setScript] = useState<PitchScript | null>(null);
  const [copied, setCopied] = useState(false);

  // AI enhancement
  const { enhance, isLoading: isEnhancing, error: enhanceError, enhancedScript } = usePitchEnhance();

  const handleGenerate = useCallback(() => {
    if (!reverseOutputs) return;

    const context: ClientContext = {
      industry: reverseInputs.economics.industry,
      ...(companyName && { companyName }),
      ...(companySize && { companySize: companySize as ClientContext['companySize'] }),
      ...(decisionMakerRole && { decisionMakerRole: decisionMakerRole as ClientContext['decisionMakerRole'] }),
    };

    const generated = generatePitchScript(
      reverseInputs,
      reverseOutputs,
      selectedScenario,
      context
    );
    setScript(generated);
  }, [reverseInputs, reverseOutputs, selectedScenario, companyName, companySize, decisionMakerRole]);

  const handleCopy = useCallback(() => {
    const activeScript = enhancedScript || script;
    if (!activeScript) return;

    const text = [
      '--- ÖPPNING ---',
      activeScript.opening,
      '',
      '--- PROBLEM ---',
      activeScript.problem,
      '',
      '--- LÖSNING ---',
      activeScript.solution,
      '',
      '--- INVÄNDNINGSHANTERING ---',
      ...activeScript.objectionHandling.map((obj, i) => `${i + 1}. ${obj}`),
      '',
      '--- AVSLUTNING ---',
      activeScript.closing,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [script, enhancedScript]);

  const handleEnhance = useCallback(() => {
    if (!script || !reverseOutputs) return;

    const context: ClientContext = {
      industry: reverseInputs.economics.industry,
      ...(companyName && { companyName }),
      ...(companySize && { companySize: companySize as ClientContext['companySize'] }),
      ...(decisionMakerRole && { decisionMakerRole: decisionMakerRole as ClientContext['decisionMakerRole'] }),
    };

    enhance({
      script,
      context,
      reverseInputs,
      reverseOutputs,
      selectedScenario,
    });
  }, [script, reverseInputs, reverseOutputs, selectedScenario, companyName, companySize, decisionMakerRole, enhance]);

  if (!reverseOutputs) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center space-y-2">
        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">
          Fyll i Bakåt-kalkylatorn först och tryck &quot;Beräkna krav&quot; för att kunna generera ett pitch-script.
        </p>
      </div>
    );
  }

  const activeScript = enhancedScript || script;

  return (
    <div className="space-y-6">
      {/* Client Context Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Kundkontext (valfritt)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Företagsnamn</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="t.ex. Acme AB"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Företagsstorlek</Label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj storlek" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(companySizeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Beslutsfattarens roll</Label>
              <Select value={decisionMakerRole} onValueChange={setDecisionMakerRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj roll" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Generera pitch
      </Button>

      {/* Generated Script */}
      {activeScript && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Pitch-script</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Kopierat
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Kopiera
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                disabled={isEnhancing}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {isEnhancing ? 'Förbättrar...' : 'Förbättra med AI'}
              </Button>
            </div>
          </div>

          {enhanceError && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3 text-sm">
              <p className="text-orange-700 dark:text-orange-400">{enhanceError}</p>
            </div>
          )}

          {enhancedScript && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-3 text-sm">
              <p className="text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Förbättrad med AI
              </p>
            </div>
          )}

          <ScriptSection title="Öppning" content={activeScript.opening} />
          <ScriptSection title="Problem" content={activeScript.problem} />
          <ScriptSection title="Lösning" content={activeScript.solution} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Invändningshantering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeScript.objectionHandling.map((objection, i) => (
                <div key={i} className="text-sm leading-relaxed pl-4 border-l-2 border-muted">
                  {objection}
                </div>
              ))}
            </CardContent>
          </Card>

          <ScriptSection title="Avslutning" content={activeScript.closing} />
        </div>
      )}
    </div>
  );
}

function ScriptSection({ title, content }: { title: string; content: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}
