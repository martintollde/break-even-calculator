'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calculator, HelpCircle, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { ForwardCalculator } from '@/components/calculator/ForwardCalculator';
import { ReverseCalculator, defaultEconomics } from '@/components/calculator/ReverseCalculator';
import { PitchGenerator } from '@/components/calculator/PitchGenerator';
import { ROISimulator } from '@/components/calculator/roi/ROISimulator';
import { CalculatorInput, ReverseInputs, ReverseOutputs, ScenarioName } from '@/lib/types';
import { calculateReverse } from '@/lib/calculations';
import { HistoricalCalibration } from '@/components/calculator/HistoricalCalibration';
import { RegressionResult } from '@/lib/historical-calibration';

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);

  // Lifted reverse calculator state
  const [revenueTarget, setRevenueTarget] = useState<number>(10000000);
  const [mediaBudget, setMediaBudget] = useState<number>(1000000);
  const [profitMarginGoal, setProfitMarginGoal] = useState<number>(20);
  const [economics, setEconomics] = useState<CalculatorInput>(defaultEconomics);
  const [reverseOutputs, setReverseOutputs] = useState<ReverseOutputs | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioName>('budgetForTarget');
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [calibrationResult, setCalibrationResult] = useState<RegressionResult | null>(null);

  const handleCalibrationResult = useCallback((result: RegressionResult | null) => {
    setCalibrationResult(result);
  }, []);

  // Handlers for reverse calculator
  const handleRevenueTargetChange = useCallback((value: number) => {
    setRevenueTarget(value);
    setReverseOutputs(null);
  }, []);

  const handleMediaBudgetChange = useCallback((value: number) => {
    setMediaBudget(value);
    setReverseOutputs(null);
  }, []);

  const handleProfitMarginGoalChange = useCallback((value: number) => {
    setProfitMarginGoal(value);
    setReverseOutputs(null);
  }, []);

  const handleEconomicsUpdate = useCallback(<K extends keyof CalculatorInput>(
    key: K,
    value: CalculatorInput[K],
  ) => {
    setEconomics(prev => ({ ...prev, [key]: value }));
    setReverseOutputs(null);
  }, []);

  const handleEconomicsClear = useCallback((key: keyof CalculatorInput) => {
    setEconomics(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setReverseOutputs(null);
  }, []);

  const handleCalculate = useCallback(() => {
    setReverseError(null);

    try {
      if (revenueTarget <= 0) {
        setReverseError('Intäktsmålet måste vara större än 0');
        return;
      }
      if (mediaBudget <= 0) {
        setReverseError('Mediabudgeten måste vara större än 0');
        return;
      }
      if (profitMarginGoal < 0 || profitMarginGoal > 90) {
        setReverseError('Vinstmarginalen måste vara mellan 0 och 90%');
        return;
      }
      if (!economics.aov || economics.aov <= 0) {
        setReverseError('AOV måste vara större än 0');
        return;
      }

      const inputs: ReverseInputs = {
        revenueTarget,
        mediaBudget,
        profitMarginGoal: profitMarginGoal / 100,
        economics,
      };

      const result = calculateReverse(inputs);
      setReverseOutputs(result);

      if (result.scenarios.budgetForTarget.isRecommended) {
        setSelectedScenario('budgetForTarget');
      } else if (result.scenarios.maxProfitGivenMinRevenue.isRecommended) {
        setSelectedScenario('maxProfitGivenMinRevenue');
      } else if (result.scenarios.maxRevenueGivenBudget.isRecommended) {
        setSelectedScenario('maxRevenueGivenBudget');
      }
    } catch (err) {
      setReverseError(err instanceof Error ? err.message : 'Ett fel uppstod vid beräkning');
    }
  }, [revenueTarget, mediaBudget, profitMarginGoal, economics]);

  // Derive ReverseInputs for child components
  const reverseInputs: ReverseInputs = {
    revenueTarget,
    mediaBudget,
    profitMarginGoal: profitMarginGoal / 100,
    economics,
  };

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold tracking-tight">
              Break-even ROAS Calculator
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(!showHelp)}
              className="text-muted-foreground"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </CardHeader>

          {showHelp && (
            <div className="mx-6 mb-4 rounded-lg border bg-muted/50 p-4 text-sm space-y-3">
              <p className="font-medium">Fyra lägen att använda:</p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium">Framåt (break-even)</p>
                    <p className="text-muted-foreground">
                      Ange dina ekonomiska parametrar och se vilken ROAS som krävs för att nå lönsamhet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calculator className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Bakåt (kravberäkning)</p>
                    <p className="text-muted-foreground">
                      Ange dina affärsmål (intäkt, budget, vinstmarginal) och se vilka krav som ställs för att nå dem.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-purple-600" />
                  <div>
                    <p className="font-medium">Pitch (säljscript)</p>
                    <p className="text-muted-foreground">
                      Generera ett anpassat säljscript baserat på kalkyldata. Kan förbättras med AI.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 mt-0.5 text-orange-600" />
                  <div>
                    <p className="font-medium">ROI (simulator)</p>
                    <p className="text-muted-foreground">
                      Simulera 12-månaders ROI med interaktiva grafer. Jämför &quot;om vi agerar&quot; vs &quot;om vi väntar&quot;.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Ju fler egna värden du anger, desto högre precision. Värden som saknas fylls i med branschsnitt.
              </p>
            </div>
          )}

          <CardContent>
            <Tabs defaultValue="forward" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
                <TabsTrigger value="forward" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Framåt
                </TabsTrigger>
                <TabsTrigger value="reverse" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Bakåt
                </TabsTrigger>
                <TabsTrigger value="pitch" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Pitch
                </TabsTrigger>
                <TabsTrigger value="roi" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ROI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="forward">
                <ForwardCalculator />
              </TabsContent>

              <TabsContent value="reverse">
                <div className="space-y-6">
                  <ReverseCalculator
                    revenueTarget={revenueTarget}
                    mediaBudget={mediaBudget}
                    profitMarginGoal={profitMarginGoal}
                    economics={economics}
                    outputs={reverseOutputs}
                    selectedScenario={selectedScenario}
                    onRevenueTargetChange={handleRevenueTargetChange}
                    onMediaBudgetChange={handleMediaBudgetChange}
                    onProfitMarginGoalChange={handleProfitMarginGoalChange}
                    onEconomicsUpdate={handleEconomicsUpdate}
                    onEconomicsClear={handleEconomicsClear}
                    onCalculate={handleCalculate}
                    onScenarioSelect={setSelectedScenario}
                    error={reverseError}
                  />
                  <HistoricalCalibration
                    onCalibrationResult={handleCalibrationResult}
                  />
                  {calibrationResult && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      Kalibrerad modell aktiv (R² = {calibrationResult.rSquared.toFixed(2)}, b = {calibrationResult.b.toFixed(3)})
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pitch">
                <PitchGenerator
                  reverseInputs={reverseInputs}
                  reverseOutputs={reverseOutputs}
                  selectedScenario={selectedScenario}
                />
              </TabsContent>

              <TabsContent value="roi">
                <ROISimulator
                  reverseInputs={reverseInputs}
                  reverseOutputs={reverseOutputs}
                  selectedScenario={selectedScenario}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
