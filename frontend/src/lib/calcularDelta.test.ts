import { describe, it, expect } from "vitest";
import { calcularAnilhas } from "./calcularAnilhas";
import { calcularDelta } from "./calcularDelta";

const LB = 0.453592;

// Wrapper conveniente para usar CalcResult diretamente nos testes
function delta(curr: ReturnType<typeof calcularAnilhas>, newTotalKg: number) {
  return calcularDelta(curr.plates, curr.barWeight as 15 | 20, curr.achievedTotal, newTotalKg);
}

// ─── Só adicionar, sem remover ───────────────────────────────────────────────
describe("calcularDelta — só adicionar", () => {
  it("adicionar 1×10kg: toAdd=[10kg], toRemove=[]", () => {
    const curr = calcularAnilhas(20 + 2 * 45 * LB, 20);
    const r = delta(curr, 20 + 2 * (45 * LB + 10));

    expect(r.status).not.toBe("error");
    expect(r.toRemove).toHaveLength(0);
    expect(r.toAdd.find((s) => s.plate.id === "10kg")?.count).toBe(1);
  });

  it("resultado exato: residualKg ≈ 0", () => {
    const curr = calcularAnilhas(20 + 2 * 45 * LB, 20);
    const r = delta(curr, 20 + 2 * (45 * LB + 10));
    expect(r.status).toBe("exact");
    expect(Math.abs(r.residualKg)).toBeLessThan(0.01);
  });
});

// ─── Remoção de removíveis ───────────────────────────────────────────────────
describe("calcularDelta — remoção de removíveis", () => {
  it("5 kg é removida quando novo greedy não precisa dela", () => {
    const curr = calcularAnilhas(20 + 2 * (45 * LB + 5), 20);
    const r = delta(curr, 20 + 2 * (45 * LB + 10));

    expect(r.toRemove.map((s) => s.plate.id)).toContain("5kg");
    expect(r.toAdd.map((s) => s.plate.id)).toContain("10kg");
  });

  it("fixas nunca aparecem em toRemove", () => {
    const fixedIds = new Set(["45lb", "35lb", "25lb", "15lb", "10lb", "10kg"]);
    const curr = calcularAnilhas(20 + 2 * (45 * LB + 5), 20);
    const r = delta(curr, 20 + 2 * (45 * LB + 10));
    for (const s of r.toRemove) {
      expect(fixedIds.has(s.plate.id)).toBe(false);
    }
  });
});

// ─── Caminho B: trava fixas ──────────────────────────────────────────────────
describe("calcularDelta — caminho B: trava fixas", () => {
  it("35lb travada quando greedy puro a descartaria", () => {
    const curr = calcularAnilhas(20 + 2 * 35 * LB, 20);
    const r = delta(curr, 92);
    expect(r.status).not.toBe("error");
    expect(r.toRemove.map((s) => s.plate.id)).not.toContain("35lb");
    expect(r.toAdd.length).toBeGreaterThan(0);
  });

  it("newAchievedTotal inclui o peso das fixas travadas", () => {
    const curr = calcularAnilhas(20 + 2 * 35 * LB, 20);
    const r = delta(curr, 92);
    expect(r.newAchievedTotal).toBeGreaterThan(20 + 2 * 35 * LB);
  });
});

// ─── Resultado inatingível ───────────────────────────────────────────────────
describe("calcularDelta — resultado inatingível", () => {
  it("status approximate com residualKg correto", () => {
    const curr = calcularAnilhas(40, 20); // 1×10kg per side
    const r = delta(curr, 43); // impossível exato

    expect(r.status).toBe("approximate");
    expect(Math.abs(r.newAchievedTotal - r.requestedTotal - r.residualKg)).toBeLessThan(0.001);
  });

  it("newAchievedTotal - requestedTotal === residualKg", () => {
    const curr = calcularAnilhas(40, 20);
    const r = delta(curr, 43);
    expect(Math.abs(r.newAchievedTotal - r.requestedTotal - r.residualKg)).toBeLessThan(0.001);
  });
});

// ─── Estoque esgotado ────────────────────────────────────────────────────────
describe("calcularDelta — estoque esgotado", () => {
  it("toAdd counts respeitam pares disponíveis", () => {
    const curr = calcularAnilhas(20 + 2 * 35 * LB, 20);
    const r = delta(curr, 150);
    if (r.status !== "error") {
      for (const s of r.toAdd) {
        expect(s.count).toBeGreaterThan(0);
        expect(s.count).toBeLessThanOrEqual(s.plate.pairs);
      }
    }
  });

  it("1.25kg esgotado não é duplicado além do estoque", () => {
    const curr = calcularAnilhas(20 + 2 * (45 * LB + 1.25), 20);
    const r = delta(curr, 20 + 2 * (45 * LB + 1.25 + 10));
    expect(r.status).not.toBe("error");
    const add = r.toAdd.find((s) => s.plate.id === "1.25kg");
    if (add) expect(1 + add.count).toBeLessThanOrEqual(1); // 1 par max
  });
});

// ─── Removível reutilizada ───────────────────────────────────────────────────
describe("calcularDelta — removível reutilizada", () => {
  it("2.5kg mantida: nem em toAdd nem em toRemove quando contagem não muda", () => {
    const curr = calcularAnilhas(20 + 2 * (35 * LB + 2.5), 20);
    const r = delta(curr, 80);
    expect(r.status).not.toBe("error");
    const addCount = r.toAdd.find((s) => s.plate.id === "2.5kg")?.count ?? 0;
    const removeCount = r.toRemove.find((s) => s.plate.id === "2.5kg")?.count ?? 0;
    expect(addCount > 0 && removeCount > 0).toBe(false);
  });
});

// ─── Validações ─────────────────────────────────────────────────────────────
describe("calcularDelta — validações", () => {
  it("novo peso igual ao atingido → erro", () => {
    const curr = calcularAnilhas(100, 20);
    const r = delta(curr, curr.achievedTotal);
    expect(r.status).toBe("error");
  });

  it("novo peso menor → erro", () => {
    expect(delta(calcularAnilhas(100, 20), 80).status).toBe("error");
  });

  it("NaN → erro", () => {
    const curr = calcularAnilhas(100, 20);
    expect(calcularDelta(curr.plates, 20, curr.achievedTotal, NaN).status).toBe("error");
  });

  it("fixas nunca em toRemove (qualquer cenário)", () => {
    const fixedIds = new Set(["45lb", "35lb", "25lb", "15lb", "10lb", "10kg"]);
    const curr = calcularAnilhas(100, 20);
    const r = delta(curr, 150);
    for (const s of r.toRemove) expect(fixedIds.has(s.plate.id)).toBe(false);
  });
});

// ─── Cadeia de cargas ────────────────────────────────────────────────────────
describe("calcularDelta — cadeia de 3+ cargas exatas", () => {
  it("3 cargas encadeadas com 10kg: cada delta é +1×10kg", () => {
    // Base: 1×10kg per side (40 kg total)
    const base = calcularAnilhas(40, 20);
    expect(base.plates[0].plate.id).toBe("10kg");
    expect(base.plates[0].count).toBe(1);

    // Carga 2: 60 kg → +1×10kg
    const r2 = calcularDelta(base.plates, 20, base.achievedTotal, 60);
    expect(r2.status).toBe("exact");
    expect(r2.toAdd.find((s) => s.plate.id === "10kg")?.count).toBe(1);
    expect(r2.toRemove).toHaveLength(0);
    expect(r2.newPlates.find((s) => s.plate.id === "10kg")?.count).toBe(2);

    // Carga 3: 80 kg → +1×10kg (3 total; usa último par disponível)
    const r3 = calcularDelta(r2.newPlates, 20, r2.newAchievedTotal, 80);
    expect(r3.status).toBe("exact");
    expect(r3.newPlates.find((s) => s.plate.id === "10kg")?.count).toBe(3);
  });

  it("newAchievedTotal da etapa anterior é base da próxima", () => {
    const base = calcularAnilhas(40, 20);
    const r2 = calcularDelta(base.plates, 20, base.achievedTotal, 60);
    const r3 = calcularDelta(r2.newPlates, 20, r2.newAchievedTotal, 80);
    // Tentar voltar ao peso da etapa anterior → erro
    const err = calcularDelta(r3.newPlates, 20, r3.newAchievedTotal, r2.newAchievedTotal);
    expect(err.status).toBe("error");
  });
});

describe("calcularDelta — cadeia com carga intermediária inatingível", () => {
  it("carga aproximada não impede prosseguir", () => {
    const base = calcularAnilhas(40, 20); // 1×10kg, exact
    const r2 = calcularDelta(base.plates, 20, base.achievedTotal, 43); // inatingível
    expect(r2.status).toBe("approximate");

    // Mesmo assim, continua a partir do peso atingido
    const r3 = calcularDelta(r2.newPlates, 20, r2.newAchievedTotal, 60);
    expect(r3.status).not.toBe("error");
    expect(r3.newAchievedTotal).toBeGreaterThan(r2.newAchievedTotal);
  });

  it("cadeia usa newAchievedTotal (não requestedTotal) da etapa anterior", () => {
    const base = calcularAnilhas(40, 20);
    const r2 = calcularDelta(base.plates, 20, base.achievedTotal, 43);
    // 43 é inatingível; atingido ≈ 42.5
    expect(r2.newAchievedTotal).toBeLessThan(43);
    // Próxima carga baseada no atingido: 43 > 42.5 deve funcionar
    const r3 = calcularDelta(r2.newPlates, 20, r2.newAchievedTotal, 43);
    // 43 ainda pode ser o target válido pois > newAchievedTotal
    expect(r3.status).not.toBe("error");
  });
});

describe("calcularDelta — estoque acumulado ao longo da cadeia", () => {
  it("10kg esgotado no 4º step: greedy usa outras anilhas", () => {
    // Esgota 10kg progressivamente: 1 → 2 → 3 pares
    const base = calcularAnilhas(40, 20);                    // 1×10kg
    const r2 = calcularDelta(base.plates, 20, base.achievedTotal, 60); // 2×10kg
    const r3 = calcularDelta(r2.newPlates, 20, r2.newAchievedTotal, 80); // 3×10kg (esgotado)

    // 4ª carga: 10kg esgotado, deve usar outras anilhas para cobrir o restante
    const r4 = calcularDelta(r3.newPlates, 20, r3.newAchievedTotal, 100);
    expect(r4.status).not.toBe("error");
    // toAdd não pode conter 10kg (esgotado nas fixas travadas)
    expect(r4.toAdd.map((s) => s.plate.id)).not.toContain("10kg");
    // Alguma outra anilha cobre o peso
    expect(r4.toAdd.length).toBeGreaterThan(0);
  });

  it("removível retirada num step e recolocada no seguinte: contabilização correta", () => {
    // Step 0: 45lb + 5kg
    const base = calcularAnilhas(20 + 2 * (45 * LB + 5), 20);
    // Step 1: troca 5kg por 10kg (toRemove=[5kg], toAdd=[10kg])
    const r2 = delta(base, 20 + 2 * (45 * LB + 10));
    expect(r2.toRemove.find((s) => s.plate.id === "5kg")).toBeTruthy();
    // Step 2: a partir de [45lb+10kg], adiciona 5kg de volta (5kg voltou ao estoque)
    const r3 = calcularDelta(r2.newPlates, 20, r2.newAchievedTotal, 20 + 2 * (45 * LB + 10 + 5));
    expect(r3.status).not.toBe("error");
    expect(r3.toAdd.find((s) => s.plate.id === "5kg")).toBeTruthy();
  });
});
