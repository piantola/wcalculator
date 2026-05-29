# wcalculator

Calculadora de anilhas para barra com suporte a cargas progressivas. Informe o peso total desejado e a barra — o app calcula quais anilhas colocar em cada lado, com suporte a libras e quilogramas.

PWA instalável no iPhone e Android. Funciona offline após o primeiro acesso.

**App**: https://piantola.github.io/wcalculator/

---

## Funcionalidades

- Cálculo para barras de 15 kg e 20 kg
- Anilhas em libras (45, 35, 25, 15, 10) e quilogramas (10, 5, 2,5, 1,25)
- Cargas progressivas ilimitadas: calcula somente as anilhas a adicionar ou trocar a cada nova carga
- Anilhas fixas (nunca removidas) vs. removíveis (podem ser trocadas a cada step)
- Solução mais próxima quando o peso exato for inatingível, priorizando o menor desvio absoluto
- Estoque configurável em `/estoque` — quantidades persistidas no `localStorage`
- Diagrama visual da meia barra com cores por tipo de anilha

## Instalação como PWA

**Android**: Chrome → menu → "Adicionar à tela inicial"

**iPhone**: Safari → compartilhar → "Adicionar à Tela de Início"

---

## Desenvolvimento

```bash
cd frontend
npm install
npm run dev        # localhost:3000
```

## Build e deploy

```bash
cd frontend
npm run build      # output estático em frontend/out/
```

Deploy automático via GitHub Actions para GitHub Pages a cada push em `main`.

O build usa `--webpack` por compatibilidade com `@ducanh2912/next-pwa`; em desenvolvimento usa Turbopack.

## Testes

```bash
cd frontend
npm test           # unitários (Vitest) — lógica de cálculo e delta
npm run test:e2e   # integração (Playwright) — fluxos de usuário e estoque
```

---

## Arquitetura

```
frontend/src/
  app/
    page.tsx              # tela principal — cálculo e cadeia de cargas
    estoque/page.tsx      # tela de estoque
    layout.tsx            # StockProvider + fontes + meta PWA
  lib/
    calcularAnilhas.ts    # greedy descrescente; aceita stockPairs opcional
    calcularDelta.ts      # delta entre cargas; caminho A (greedy livre) ou B (fixas travadas)
    plates.ts             # catálogo de anilhas com pesos e cores
    types.ts              # CalcResult, DeltaResult, PlateSlot, ...
    StockContext.tsx       # React Context global + localStorage
  components/
    BarbellDiagram.tsx    # SVG de meia barra
    CadeiaCargas.tsx      # cadeia de cargas progressivas
    ResultPanel.tsx
    PlateList.tsx
    ResidualBanner.tsx
    BarSelector.tsx
    WeightInput.tsx
```

### Regras de anilhas

| Classificação | Anilhas                          | Comportamento na cadeia        |
|---------------|----------------------------------|-------------------------------|
| Fixas         | 45 lb, 35 lb, 25 lb, 15 lb, 10 lb, 10 kg | Nunca removidas após colocadas |
| Removíveis    | 5 kg, 2,5 kg, 1,25 kg           | Podem ser trocadas a qualquer passo |
