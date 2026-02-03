# Break-even ROAS Calculator

## Projektöversikt

Intern kalkylator för digital marknadsföringsbyrå som hjälper specialister beräkna break-even ROAS och target KPI:er för paid media-kunder.

| Info | Värde |
|------|-------|
| **Live URL** | https://breakeven.martintollde.se |
| **Repository** | github.com/martintollde/break-even-calculator |
| **Hosting** | Vercel (auto-deploy vid push till main) |
| **Tech Stack** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |

---

## Snabbkommandon
```bash
# Lokal utveckling
npm run dev                  # Starta dev-server → localhost:3000

# Tester
npm test                     # Kör alla tester
npm run test:watch           # Tester i watch mode

# Deploy (automatiskt via Vercel)
git add .
git commit -m "Beskrivning"
git push                     # Auto-deploy inom 1-2 min
```

---

## Projektstruktur
```
break-even-calculator/
├── app/
│   ├── page.tsx              # Huvudsida med tab-navigation
│   └── layout.tsx            # Layout med metadata
├── components/
│   ├── calculator/
│   │   ├── ForwardCalculator.tsx    # Framåt-kalkylator (break-even)
│   │   ├── ReverseCalculator.tsx    # Bakåt-kalkylator (kravberäkning)
│   │   ├── StatusIndicator.tsx      # Visuell status (achievable/tight/impossible)
│   │   ├── ScenarioComparison.tsx   # Tre scenarion för jämförelse
│   │   └── shared/
│   │       └── EconomicsInputs.tsx  # Delad komponent för ekonomiska inputs
│   └── ui/                          # shadcn/ui komponenter
├── lib/
│   ├── calculations.ts       # Beräkningslogik (framåt + bakåt)
│   ├── calculations.test.ts  # 59 tester för beräkningar
│   ├── scenarios.ts          # Scenario-generering för bakåt-kalkylatorn
│   ├── scenarios.test.ts     # 34 tester för scenarion
│   ├── defaults.ts           # Bransch-defaults
│   └── types.ts              # TypeScript interfaces
├── PROJECT.md                # Denna fil
└── package.json
```

---

## Kärnprinciper

### 1. Progressive Precision
Verktyget ska ge värde även med ofullständig input. Använd bransch-defaults som fallback och visa tydligt vad som är antaganden vs faktisk input.

### 2. Pedagogiskt
Varje term ska ha tooltip med förklaring. Juniora specialister ska förstå vad de räknar på.

### 3. Kommersiellt fokus
Alla features ska ha tydlig koppling till affärsvärde - antingen intern effektivitet eller stärkt kundleverans.

---

## Beräkningslogik

### Formler
```
# Break-even ROAS
Effektiv intäkt = AOV × (1 - returgrad)
Bruttovinst = Effektiv intäkt × marginal
Payment fee = AOV × payment_fee_procent
Fraktkostnad = fast_belopp ELLER (AOV × frakt_procent)
Nettovinst = Bruttovinst - Fraktkostnad - Payment fee
Break-even ROAS = AOV / Nettovinst

# Target ROAS (med önskad vinstmarginal)
Target ROAS = AOV / (Nettovinst × (1 - önskad_vinstmarginal))

# COS (Cost of Sale) - inverterad ROAS
COS = (1 / ROAS) × 100

# Max CPA
Max CPA = Nettovinst
Max CPA med LTV = Nettovinst × LTV-multiplikator
```

### Exempelberäkning
```
Input:
  AOV = 1000 SEK
  Marginal = 50%
  Returgrad = 10%
  Fraktkostnad = 50 SEK
  Payment fee = 2.5%

Beräkning:
  Effektiv intäkt = 1000 × 0.90 = 900 SEK
  Bruttovinst = 900 × 0.50 = 450 SEK
  Payment fee = 1000 × 0.025 = 25 SEK
  Nettovinst = 450 - 50 - 25 = 375 SEK
  Break-even ROAS = 1000 / 375 = 2.67

Output:
  Break-even ROAS: 2.67x
  Break-even COS: 37.5%
  Max CPA: 375 SEK
```

### Bakåt-kalkylator (Reverse Calculator)

Beräknar krav utifrån affärsmål.

```
# Input
Intäktsmål (SEK)
Mediabudget (SEK)
Önskad vinstmarginal (%)
Ekonomiska parametrar (AOV, marginal, etc.)

# Beräkning
Required ROAS = Intäktsmål / Mediabudget
Target ROAS = AOV / (Nettovinst × (1 - vinstmarginal))
Break-even ROAS = AOV / Nettovinst

# Status
achievable: Required ROAS < Target ROAS (grön)
tight: Target ROAS ≤ Required ROAS < Break-even ROAS × 1.5 (orange)
impossible: Required ROAS ≥ Break-even ROAS × 1.5 (röd)

# Tre scenarion
1. Balanserad: Optimal mix av omsättning och vinst
2. Max omsättning: Prioriterar intäktsmålet
3. Max vinst: Prioriterar vinstmarginalen (+25%)
```

---

## Bransch-defaults

Används när användaren inte anger egna värden:

| Bransch | Marginal | Returgrad | Payment Fee | Frakt | LTV |
|---------|----------|-----------|-------------|-------|-----|
| E-commerce | 50% | 8% | 2.5% | 49 SEK | 1.3x |
| Fashion | 55% | 25% | 2.5% | 0 SEK | 1.4x |
| Beauty | 65% | 5% | 2.5% | 29 SEK | 1.8x |
| Electronics | 25% | 10% | 2.5% | 0 SEK | 1.1x |
| Home & Garden | 45% | 8% | 2.5% | 99 SEK | 1.2x |
| SaaS | 80% | 5% | 2.5% | 0 SEK | 3.0x |
| Other | 50% | 8% | 2.5% | 49 SEK | 1.3x |

---

## Kodkonventioner

| Område | Konvention |
|--------|------------|
| Språk i kod | Engelska (variabler, funktioner, kommentarer) |
| Språk i UI | Svenska (labels, tooltips, felmeddelanden) |
| Komponenter | Använd shadcn/ui där möjligt |
| Styling | Tailwind CSS, minimal custom CSS |
| State | React hooks (useState, useEffect) |
| Typer | Strikt TypeScript, inga `any` |

---

## Vanliga utvecklingsuppgifter

### Lägga till nytt input-fält

1. Uppdatera `CalculatorInput` interface i `lib/types.ts`
2. Lägg till fält i UI-komponenten med label och input
3. Uppdatera beräkningslogik i `lib/calculations.ts`
4. Lägg till tooltip-förklaring
5. Lägg till validering (min/max/required)
6. Skriv test i `lib/calculations.test.ts`
7. Testa lokalt med `npm run dev`

### Lägga till ny bransch

1. Lägg till objekt i `industryDefaults` i `lib/defaults.ts`
2. Lägg till option i bransch-dropdown i UI
3. Uppdatera tabellen i denna dokumentation

### Ändra beräkningslogik

1. Uppdatera formel i `lib/calculations.ts`
2. Uppdatera/lägg till tester i `lib/calculations.test.ts`
3. Kör `npm test` och verifiera att alla tester passerar
4. Uppdatera "Beräkningslogik"-sektionen i denna fil

---

## Roadmap

### Klart (v1.0)

- [x] Grundläggande break-even ROAS-beräkning
- [x] Bransch-defaults med fallback
- [x] Progressive precision (fungerar med ofullständig input)
- [x] Confidence-indikator
- [x] Tooltips för alla termer
- [x] Responsiv design
- [x] Deploy till breakeven.martintollde.se
- [x] Önskad vinstmarginal som dynamiskt input
- [x] COS-vy (toggle mellan ROAS och COS %)
- [x] Fraktkostnad som procent eller fast SEK
- [x] Dela-länk med query params som återställer inputs
- [x] Scenario-jämförelse (spara och jämför upp till 3 scenarios)
- [x] Kopiera resultat till clipboard
- [x] ROAS/COS referenstabell
- [x] 27 verifierade beräkningstester

### Klart (v1.1 - Bakåt-kalkylator)

- [x] Tab-navigation mellan Framåt och Bakåt läge
- [x] Bakåt-kalkylator med affärsmål (intäkt, budget, vinstmarginal)
- [x] Visuell status-indikator (achievable/tight/impossible)
- [x] Tre scenarion för jämförelse (balanserad, max omsättning, max vinst)
- [x] Delad EconomicsInputs-komponent för återanvändning
- [x] 93 verifierade tester (59 beräkning + 34 scenarion)

### Planerat

**Fas 2: Utökad funktionalitet**
- [ ] PDF-export med alla värden och antaganden
- [ ] Integration med kampanjdata (visa faktisk vs target ROAS)
- [ ] Automatisk alert när kampanj underperformar vs break-even

**Idéer att utvärdera**
- Historik över sparade kalkyler per kund
- Bulk-beräkning för flera produktkategorier
- Integration med Google Sheets för import/export
- Möjlighet att spara kundprofiler med deras defaults

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| `npm run dev` startar inte | Kör `npm install` först |
| Tester failar | Kolla att beräkningslogiken matchar testernas förväntade värden |
| Vercel deploy failar | Kolla build-loggen i Vercel dashboard |
| Styling syns inte | Kör `npm run dev` igen, Tailwind kan behöva rebuilda |
| TypeScript-fel | Kör `npm run build` lokalt för att se alla fel |

---

## Kontakt & ägarskap

| Roll | Ansvarig |
|------|----------|
| Projektägare | Martin Töllde |
| Utveckling | Claude Code + Martin |
| Hosting | Vercel (martintollde-konto) |
| Domän | Loopia (martintollde.se) |
