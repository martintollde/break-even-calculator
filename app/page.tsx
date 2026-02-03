'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calculator, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ForwardCalculator } from '@/components/calculator/ForwardCalculator';
import { ReverseCalculator } from '@/components/calculator/ReverseCalculator';

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);

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
              <p className="font-medium">Två sätt att använda kalkylatorn:</p>

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
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Ju fler egna värden du anger, desto högre precision. Värden som saknas fylls i med branschsnitt.
              </p>
            </div>
          )}

          <CardContent>
            <Tabs defaultValue="forward" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="forward" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Framåt
                </TabsTrigger>
                <TabsTrigger value="reverse" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Bakåt
                </TabsTrigger>
              </TabsList>

              <TabsContent value="forward">
                <ForwardCalculator />
              </TabsContent>

              <TabsContent value="reverse">
                <ReverseCalculator />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
