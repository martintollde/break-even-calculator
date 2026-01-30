'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CalculatorInput, Industry, industryLabels } from '@/lib/types';
import { industryDefaults } from '@/lib/defaults';
import { tooltips } from '@/lib/defaults';
import { InfoTooltip } from './InfoTooltip';

interface InputSectionProps {
  inputs: CalculatorInput;
  onUpdate: <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) => void;
  onClear: (key: keyof CalculatorInput) => void;
}

function NumericInput({
  label,
  tooltip,
  value,
  onChange,
  onClear,
  suffix,
  placeholder,
  required,
  min,
  max,
  error,
}: {
  label: string;
  tooltip: string;
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  onClear?: () => void;
  suffix?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  error?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      if (onClear) onClear();
      else onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const displayValue = value !== undefined && value !== 0 ? String(value) : value === 0 && required ? '0' : '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <InfoTooltip text={tooltip} />
        {required && <span className="text-red-500 ml-1 text-xs">*</span>}
      </div>
      <div className="relative">
        <Input
          type="number"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder || '0'}
          min={min}
          max={max}
          step="any"
          className={`pr-12 ${error ? 'border-red-500' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ShippingCostInput({
  inputs,
  defaults,
  onUpdate,
  onClear,
}: {
  inputs: CalculatorInput;
  defaults: { shippingCost: number };
  onUpdate: <K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) => void;
  onClear: (key: keyof CalculatorInput) => void;
}) {
  const costType = inputs.shippingCostType ?? 'fixed';

  const handleTypeChange = (val: string) => {
    if (!val) return;
    const newType = val as 'fixed' | 'percent';
    onUpdate('shippingCostType', newType);
    // Clear the other value when switching
    if (newType === 'fixed') {
      onClear('shippingCostPercent');
    } else {
      onClear('shippingCost');
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      if (costType === 'fixed') onClear('shippingCost');
      else onClear('shippingCostPercent');
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      if (costType === 'fixed') onUpdate('shippingCost', num);
      else onUpdate('shippingCostPercent', num);
    }
  };

  const currentValue = costType === 'fixed' ? inputs.shippingCost : inputs.shippingCostPercent;
  const displayValue = currentValue !== undefined ? String(currentValue) : '';
  const calculatedSek = costType === 'percent' && inputs.shippingCostPercent !== undefined && inputs.aov > 0
    ? Math.round(inputs.aov * (inputs.shippingCostPercent / 100))
    : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center">
        <Label className="text-sm font-medium">Fraktkostnad</Label>
        <InfoTooltip text={tooltips.shippingCost} />
      </div>
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={costType}
          onValueChange={handleTypeChange}
          className="bg-muted rounded-md"
        >
          <ToggleGroupItem value="fixed" className="text-xs px-2.5 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm">
            SEK
          </ToggleGroupItem>
          <ToggleGroupItem value="percent" className="text-xs px-2.5 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm">
            %
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="relative">
        <Input
          type="number"
          value={displayValue}
          onChange={handleValueChange}
          placeholder={costType === 'fixed' ? `Default: ${defaults.shippingCost} SEK` : 't.ex. 5'}
          min={0}
          max={costType === 'percent' ? 100 : undefined}
          step="any"
          className="pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {costType === 'fixed' ? 'SEK' : '%'}
        </span>
      </div>
      {calculatedSek !== null && (
        <p className="text-xs text-muted-foreground">
          = {calculatedSek.toLocaleString('sv-SE')} SEK vid AOV {inputs.aov.toLocaleString('sv-SE')} SEK
        </p>
      )}
    </div>
  );
}

export function InputSection({ inputs, onUpdate, onClear }: InputSectionProps) {
  const defaults = industryDefaults[inputs.industry];

  const aovError = inputs.aov !== undefined && inputs.aov < 0 ? 'AOV måste vara positivt' : undefined;
  const marginError = inputs.grossMargin !== undefined && (inputs.grossMargin < 0 || inputs.grossMargin > 100)
    ? 'Marginal måste vara 0–100%' : undefined;
  const returnError = inputs.returnRate !== undefined && (inputs.returnRate < 0 || inputs.returnRate > 100)
    ? 'Returgrad måste vara 0–100%' : undefined;

  const desiredMargin = inputs.desiredProfitMargin ?? 20;
  const desiredMarginError = inputs.desiredProfitMargin !== undefined && (inputs.desiredProfitMargin < 0 || inputs.desiredProfitMargin > 90)
    ? 'Vinstmarginal måste vara 0–90%' : undefined;
  const desiredMarginWarning = inputs.desiredProfitMargin !== undefined && inputs.desiredProfitMargin > 50
    ? 'Hög vinstmarginal – säkerställ att detta är realistiskt för er marknad' : undefined;

  return (
    <div className="space-y-6">
      {/* Industry selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Bransch</Label>
        <Select
          value={inputs.industry}
          onValueChange={(val) => onUpdate('industry', val as Industry)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj bransch" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(industryLabels) as Industry[]).map((key) => (
              <SelectItem key={key} value={key}>
                {industryLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Basic inputs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Grundläggande
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumericInput
            label="Snittordervärde (AOV)"
            tooltip={tooltips.aov}
            value={inputs.aov || undefined}
            onChange={(val) => onUpdate('aov', val ?? 0)}
            suffix="SEK"
            placeholder="t.ex. 800"
            required
            min={0}
            error={aovError}
          />

          <div className="space-y-3">
            <NumericInput
              label="Produktkostnad"
              tooltip={tooltips.productCost}
              value={inputs.productCost}
              onChange={(val) => val !== undefined ? onUpdate('productCost', val) : onClear('productCost')}
              onClear={() => onClear('productCost')}
              suffix="SEK"
              placeholder={`Default: ${Math.round(inputs.aov * (1 - defaults.margin))} SEK`}
              min={0}
            />
            <div className="text-xs text-muted-foreground text-center">eller</div>
            <NumericInput
              label="Bruttomarginal"
              tooltip={tooltips.grossMargin}
              value={inputs.grossMargin}
              onChange={(val) => val !== undefined ? onUpdate('grossMargin', val) : onClear('grossMargin')}
              onClear={() => onClear('grossMargin')}
              suffix="%"
              placeholder={`Default: ${(defaults.margin * 100).toFixed(0)}%`}
              min={0}
              max={100}
              error={marginError}
            />
          </div>
        </div>

        {/* Desired profit margin */}
        <div className="mt-4 max-w-xs">
          <NumericInput
            label="Önskad vinstmarginal"
            tooltip={tooltips.desiredProfitMargin}
            value={inputs.desiredProfitMargin}
            onChange={(val) => val !== undefined ? onUpdate('desiredProfitMargin', val) : onClear('desiredProfitMargin')}
            onClear={() => onClear('desiredProfitMargin')}
            suffix="%"
            placeholder="Default: 20%"
            min={0}
            max={90}
            error={desiredMarginError}
          />
          {desiredMarginWarning && !desiredMarginError && (
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">{desiredMarginWarning}</p>
          )}
          <div className="flex gap-2 mt-2">
            {[10, 20, 30].map(val => (
              <Button
                key={val}
                type="button"
                variant={desiredMargin === val ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => onUpdate('desiredProfitMargin', val)}
              >
                {val}%
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced inputs */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
            Avancerade inställningar
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
              <NumericInput
                label="Returgrad"
                tooltip={tooltips.returnRate}
                value={inputs.returnRate}
                onChange={(val) => val !== undefined ? onUpdate('returnRate', val) : onClear('returnRate')}
                onClear={() => onClear('returnRate')}
                suffix="%"
                placeholder={`Default: ${(defaults.returnRate * 100).toFixed(0)}%`}
                min={0}
                max={100}
                error={returnError}
              />
              <ShippingCostInput
                inputs={inputs}
                defaults={defaults}
                onUpdate={onUpdate}
                onClear={onClear}
              />
              <NumericInput
                label="Payment fee"
                tooltip={tooltips.paymentFee}
                value={inputs.paymentFee}
                onChange={(val) => val !== undefined ? onUpdate('paymentFee', val) : onClear('paymentFee')}
                onClear={() => onClear('paymentFee')}
                suffix="%"
                placeholder={`Default: ${(defaults.paymentFee * 100).toFixed(1)}%`}
                min={0}
              />
            </div>
            <div className="mt-4 max-w-xs">
              <NumericInput
                label="LTV-multiplikator"
                tooltip={tooltips.ltvMultiplier}
                value={inputs.ltvMultiplier}
                onChange={(val) => val !== undefined ? onUpdate('ltvMultiplier', val) : onClear('ltvMultiplier')}
                onClear={() => onClear('ltvMultiplier')}
                suffix="x"
                placeholder={`Default: ${defaults.ltvMultiplier}x`}
                min={1}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
