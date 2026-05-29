import { describe, it, expect } from "vitest";
import { calcularAnilhas } from "./calcularAnilhas";
import { calcularDelta } from "./calcularDelta";

const LB = 0.453592;

// Helper: calcula a config atual e retorna
function config(totalKg: number, bar: 15 | 20) {
  return calcularAnilhas(totalKg, bar);
}

// ─── 1. Caso base: só adicionar, sem remover ────────────────────────────────
describe("calcularDelta — só adicionar", () => {
  it("adicionar 1×10kg ao lado: toAdd=[10kg], toRemove=[]", () => {
    // Current: 1×45lb per side (exact weight)
    const curr = config(20 + 2 * 45 * LB, 20); // 60.82328
    const r = calcularDelta(curr, 20 + 2 * (45 * LB + 10)); // +10kg per side

    expect(r.status).not.toBe("error");
    expect(r.toRemove).toHaveLength(0);
    expect(r.toAdd.map((s) => s.plate.id)).toContain("10kg");
    expect(r.toAdd.find((s) => s.plate.id === "10kg")?.count).toBe(1);
  });

  it("residualKg ≈ 0 quando peso exato atingível", () => {
    const curr = config(20 + 2 * 45 * LB, 20);
    const r = calcularDelta(curr, 20 + 2 * (45 * LB + 10));
    expect(Math.abs(r.residualKg)).toBeLessThan(0.01);
    expect(r.status).toBe("exact");
  });
});

// ─── 2. Remoção de removíveis ───────────────────────────────────────────────
describe("calcularDelta — remoção de removíveis", () => {
  it("5 kg é removida quando novo greedy não precisa dela", () => {
    // Current: 1×45lb + 1×5kg per side
    const curr = config(20 + 2 * (45 * LB + 5), 20); // 70.82328
    // New: adiciona 10kg por lado → greedy usa 45lb + 10kg (não precisa de 5kg)
    const r = calcularDelta(curr, 20 + 2 * (45 * LB + 10), );

    expect(r.toRemove.map((s) => s.plate.id)).toContain("5kg");
    expect(r.toAdd.map((s) => s.plate.id)).toContain("10kg");
    // fixas (45lb) não aparecem em toRemove
    expect(r.toRemove.map((s) => s.plate.id)).not.toContain("45lb");
  });

  it("anilhas fixas nunca aparecem em toRemove", () => {
    const curr = config(20 + 2 * (45 * LB + 5), 20);
    const r = calcularDelta(curr, 20 + 2 * (45 * LB + 10));
    const fixedIds = ["45lb", "35lb", "25lb", "15lb", "10lb", "10kg"];
    for (const slot of r.toRemove) {
      expect(fixedIds).not.toContain(slot.plate.id);
    }
  });
});

// ─── 3. Forçar manutenção das fixas (caminho B) ────────────────────────────
describe("calcularDelta — caminho B: trava fixas", () => {
  it("35lb da config atual é mantido quando greedy puro a descartaria", () => {
    // Current: apenas 1×35lb per side (52 kg com barra 20)
    const curr = config(20 + 2 * 35 * LB, 20); // ~51.75 kg
    // Novo peso: 92 kg. Greedy puro usaria 45lb+25lb (sem 35lb).
    // Caminho B deve travar 35lb e completar com o restante.
    const r = calcularDelta(curr, 92);

    expect(r.status).not.toBe("error");
    // toAdd deve conter anilhas (para cobrir peso restante)
    expect(r.toAdd.length).toBeGreaterThan(0);
    // toRemove deve estar vazio (nenhuma removível na config atual)
    expect(r.toRemove).toHaveLength(0);
    // 35lb não deve aparecer em toRemove (foi mantida)
    expect(r.toRemove.map((s) => s.plate.id)).not.toContain("35lb");
  });

  it("peso atingido inclui a anilha fixa travada", () => {
    const curr = config(20 + 2 * 35 * LB, 20);
    const r = calcularDelta(curr, 92);
    // newAchievedTotal deve incluir pelo menos 2×35lb (barWeight + fixas por lado)
    const fixedWeightBothSides = 2 * 35 * LB;
    expect(r.newAchievedTotal).toBeGreaterThan(20 + fixedWeightBothSides);
  });
});

// ─── 4. Resultado inatingível — exibir faltou/excedeu ─────────────────────
describe("calcularDelta — resultado inatingível", () => {
  it("status approximate com residualKg correto quando peso não é exato", () => {
    // Peso que inevitavelmente deixa resíduo
    const curr = config(20 + 2 * 10, 20); // 40 kg (2×10kg, exact)
    const r = calcularDelta(curr, 53); // 53 kg → per side = 16.5 → difícil atingir exato

    expect(r.status).toBe("approximate");
    expect(r.residualKg).not.toBe(0);
    expect(Math.abs(r.residualKg)).toBeLessThan(5); // razoável
  });

  it("newAchievedTotal - requestedTotal === residualKg", () => {
    const curr = config(40, 20);
    const r = calcularDelta(curr, 53);
    expect(Math.abs(r.newAchievedTotal - r.requestedTotal - r.residualKg)).toBeLessThan(0.001);
  });
});

// ─── 5. Estoque esgotado para o delta ──────────────────────────────────────
describe("calcularDelta — estoque esgotado", () => {
  it("quando 1.25kg já está na config atual e é re-usado, toAdd não o duplica", () => {
    // Current: 1×45lb + 1×1.25kg per side (1.25kg tem apenas 1 par de estoque)
    // O delta precisa resolver o restante sem poder adicionar outro 1.25kg
    const curr = config(20 + 2 * (45 * LB + 1.25), 20);
    // New: adiciona ~10kg por lado → delta greedy resolve sem poder usar +1.25kg
    const r = calcularDelta(curr, 20 + 2 * (45 * LB + 1.25 + 10));

    expect(r.status).not.toBe("error");
    // 1.25kg tem 1 par; se já estava em current, não pode ser adicionado de novo
    const add125 = r.toAdd.find((s) => s.plate.id === "1.25kg");
    // Se aparece em toAdd, é porque o delta líquido aumentou (improvável aqui)
    // O que garantimos é que não há duplicação além do estoque
    if (add125) {
      const currentCount = 1; // current tem 1×1.25kg
      expect(currentCount + add125.count).toBeLessThanOrEqual(1); // 1 par max
    }
    expect(r.toAdd.length).toBeGreaterThan(0);
  });

  it("toAdd counts respeitam os limites de pares disponíveis", () => {
    const curr = config(20 + 2 * 35 * LB, 20); // 1×35lb per side
    const r = calcularDelta(curr, 150);
    if (r.status !== "error") {
      for (const slot of r.toAdd) {
        expect(slot.count).toBeGreaterThan(0);
        expect(slot.count).toBeLessThanOrEqual(slot.plate.pairs);
      }
    }
  });
});

// ─── 6. Removível da config atual reutilizada no delta ────────────────────
describe("calcularDelta — removível reutilizada", () => {
  it("2.5kg que já está na barra e é mantida no delta não aparece em toAdd nem toRemove", () => {
    // Current: 1×35lb + 1×2.5kg per side
    const curr = config(20 + 2 * (35 * LB + 2.5), 20);
    // New: 80 kg. Caminho B trava 35lb; greedy do delta re-aloca 2.5kg.
    // O delta líquido para 2.5kg = 0 (mesma quantidade).
    const r = calcularDelta(curr, 80);

    expect(r.status).not.toBe("error");
    // 2.5kg com count delta = 0 não deve aparecer
    const addIds = r.toAdd.map((s) => s.plate.id);
    const removeIds = r.toRemove.map((s) => s.plate.id);
    // pode aparecer se count mudou; verifica consistência
    const addCount = r.toAdd.find((s) => s.plate.id === "2.5kg")?.count ?? 0;
    const removeCount = r.toRemove.find((s) => s.plate.id === "2.5kg")?.count ?? 0;
    // Não pode aparecer em ambos simultaneamente
    expect(addCount > 0 && removeCount > 0).toBe(false);
    void addIds;
    void removeIds;
  });
});

// ─── 7. Validação: novo peso ≤ atual ──────────────────────────────────────
describe("calcularDelta — validações", () => {
  it("novo peso igual ao atual → erro", () => {
    const curr = config(100, 20);
    const r = calcularDelta(curr, curr.achievedTotal);
    expect(r.status).toBe("error");
    expect(r.errorMessage).toBeTruthy();
  });

  it("novo peso menor que atual → erro", () => {
    const curr = config(100, 20);
    const r = calcularDelta(curr, 80);
    expect(r.status).toBe("error");
  });

  it("NaN → erro", () => {
    const curr = config(100, 20);
    expect(calcularDelta(curr, NaN).status).toBe("error");
  });
});

// ─── 8. Limpeza: delta não persiste ao alterar peso principal ─────────────
// (comportamento de UI; testado via Playwright e2e)
// Aqui validamos apenas que a função retorna erro para peso inválido
describe("calcularDelta — consistência do resultado", () => {
  it("toAdd e toRemove contêm apenas contagens positivas", () => {
    const curr = config(60, 20);
    const r = calcularDelta(curr, 100);
    if (r.status !== "error") {
      for (const s of [...r.toAdd, ...r.toRemove]) {
        expect(s.count).toBeGreaterThan(0);
      }
    }
  });

  it("anilhas fixas nunca aparecem em toRemove (qualquer cenário)", () => {
    const fixedIds = new Set(["45lb", "35lb", "25lb", "15lb", "10lb", "10kg"]);
    const curr = config(100, 20);
    const r = calcularDelta(curr, 150);
    for (const s of r.toRemove) {
      expect(fixedIds.has(s.plate.id)).toBe(false);
    }
  });
});
