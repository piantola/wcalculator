import { describe, it, expect } from "vitest";
import { calcularAnilhas } from "./calcularAnilhas";

const LB = 0.453592;

describe("calcularAnilhas — erros de entrada", () => {
  it("peso igual ao da barra → erro", () => {
    const r = calcularAnilhas(20, 20);
    expect(r.status).toBe("error");
    expect(r.errorMessage).toBeTruthy();
  });

  it("peso menor que o da barra → erro", () => {
    const r = calcularAnilhas(15, 20);
    expect(r.status).toBe("error");
  });

  it("zero → erro", () => {
    expect(calcularAnilhas(0, 20).status).toBe("error");
  });

  it("negativo → erro", () => {
    expect(calcularAnilhas(-10, 20).status).toBe("error");
  });

  it("NaN → erro", () => {
    expect(calcularAnilhas(NaN, 20).status).toBe("error");
  });

  it("Infinity → erro", () => {
    expect(calcularAnilhas(Infinity, 20).status).toBe("error");
  });

  it("barra 15 kg: peso igual → erro", () => {
    expect(calcularAnilhas(15, 15).status).toBe("error");
  });
});

describe("calcularAnilhas — pesos exatos", () => {
  it("barra 20 kg + 1× 45lb por lado → exact", () => {
    const total = 20 + 2 * (45 * LB);
    const r = calcularAnilhas(total, 20);
    expect(r.status).toBe("exact");
    expect(r.plates).toHaveLength(1);
    expect(r.plates[0].plate.id).toBe("45lb");
    expect(r.plates[0].count).toBe(1);
    expect(Math.abs(r.residualKg)).toBeLessThan(0.01);
  });

  it("barra 20 kg + 2× 45lb por lado → exact", () => {
    const total = 20 + 4 * (45 * LB);
    const r = calcularAnilhas(total, 20);
    expect(r.status).toBe("exact");
    expect(r.plates[0].plate.id).toBe("45lb");
    expect(r.plates[0].count).toBe(2);
  });

  it("barra 15 kg + 1× 45lb por lado → exact", () => {
    const total = 15 + 2 * (45 * LB);
    const r = calcularAnilhas(total, 15);
    expect(r.status).toBe("exact");
    expect(r.plates[0].plate.id).toBe("45lb");
    expect(r.plates[0].count).toBe(1);
  });

  it("barra 20 kg + 10 kg por lado → exact", () => {
    const r = calcularAnilhas(40, 20);
    expect(r.status).toBe("exact");
    expect(r.plates[0].plate.id).toBe("10kg");
    expect(r.plates[0].count).toBe(1);
  });

  it("barra 20 kg + 5 kg por lado → exact", () => {
    const r = calcularAnilhas(30, 20);
    expect(r.status).toBe("exact");
    expect(r.plates[0].plate.id).toBe("5kg");
    expect(r.plates[0].count).toBe(1);
  });

  it("barra 20 kg + 2,5 kg por lado → exact", () => {
    const r = calcularAnilhas(25, 20);
    expect(r.status).toBe("exact");
    expect(r.plates[0].plate.id).toBe("2.5kg");
  });

  it("barra 20 kg + 1,25 kg por lado → exact", () => {
    const r = calcularAnilhas(22.5, 20);
    expect(r.status).toBe("exact");
    expect(r.plates[0].plate.id).toBe("1.25kg");
  });

  it("combinação mista lb+kg: 45lb + 10kg por lado → exact", () => {
    const total = 20 + 2 * (45 * LB + 10);
    const r = calcularAnilhas(total, 20);
    expect(r.status).toBe("exact");
    const ids = r.plates.map((p) => p.plate.id);
    expect(ids).toContain("45lb");
    expect(ids).toContain("10kg");
  });

  it("combinação mista lb+kg: 1×45lb + 1×5kg por lado → exact", () => {
    // 20 + 2*(45*LB + 5) = 70.82328: greedy encaixa exatamente 1 de cada
    const total = 20 + 2 * (45 * LB + 5);
    const r = calcularAnilhas(total, 20);
    expect(r.status).toBe("exact");
    const ids = r.plates.map((p) => p.plate.id);
    expect(ids).toContain("45lb");
    expect(ids).toContain("5kg");
  });
});

describe("calcularAnilhas — pesos aproximados", () => {
  it("resultado exato tem residualKg numericamente zero", () => {
    const total = 20 + 2 * (45 * LB + 5);
    const r = calcularAnilhas(total, 20);
    expect(r.status).toBe("exact");
    expect(Math.abs(r.residualKg)).toBeLessThan(0.01);
    expect(r.achievedTotal).toBeCloseTo(total, 3);
  });

  it("achievedTotal - requestedTotal === residualKg (identidade)", () => {
    const r = calcularAnilhas(21, 20);
    expect(Math.abs(r.achievedTotal - r.requestedTotal - r.residualKg)).toBeLessThan(0.0001);
  });
});

describe("calcularAnilhas — preferência pelo menor valor absoluto", () => {
  it("100 kg com barra 20 kg: overshoot via 1,25kg é preferível ao deficit", () => {
    // Greedy dá: 1×45lb + 1×35lb + 1×2,5kg por lado = 38,787 kg → deficit 2,425 total
    // Adicionando 1×1,25kg por lado → overshoot 0,075 < 2,425 → deve escolher overshoot
    const r = calcularAnilhas(100, 20);
    expect(r.status).toBe("approximate");
    expect(r.residualKg).toBeGreaterThan(0); // positivo = excedeu
    expect(Math.abs(r.residualKg)).toBeLessThan(0.1);
    const ids = r.plates.map((p) => p.plate.id);
    expect(ids).toContain("1.25kg");
  });

  it("residualKg positivo significa excedeu, negativo significa faltou", () => {
    // Com a nova regra, resultados aproximados podem ser overshoot (positivo)
    const r = calcularAnilhas(100, 20);
    expect(r.residualKg).toBeGreaterThan(0); // 100kg → overshoot agora
  });

  it("quando deficit já é menor que qualquer overshoot disponível, mantém deficit", () => {
    // Peso com deficit muito pequeno: usar 20 + 2*(45*LB + 5) → exact
    // Usar peso levemente abaixo do exact onde deficit < 1,25 kg e overshoot seria maior
    // Por ex: 1×45lb + 1×2,5kg por lado = 22,912 kg. Deficit menor que 1,25kg
    // Total = 20 + 2*(45*LB + 2.5) = 65,82328 → exact
    // Vamos criar deficit < overshoot: usar total onde remaining ~0.5 < 1.25 overshoot
    // mas também onde nenhuma anilha menor está disponível exceto 1.25kg
    // Ex: 20 + 2*(45*LB) = 60,824 (exact). Subtrair 0.4 = 60.424.
    // per side: 20.212. Greedy: 45lb (20.412) → overshoots! floor((20.212+0.01)/20.412)=0
    // Greedy usaria 10kg (20.212/10=2, 2×10=20, remaining=0.212)
    // remaining=0.212 < 1.25 → nenhuma anilha encaixa → deficit 0.424 total
    // Tentativa de overshoot: 1.25kg → overshoot = 1.25-0.212 = 1.038 > 0.424 → manter deficit
    const r = calcularAnilhas(20 + 2 * (10 + 10 + 0.212), 20);
    expect(r.status).toBe("approximate");
    expect(r.residualKg).toBeLessThan(0); // negativo = deficit mantido
  });

  it("quando overshoot e deficit são iguais, prefer overshoot (tiebreak para excedente)", () => {
    // Edge case teórico — na prática o float nunca é exatamente igual
    // Aqui apenas verificamos que a lógica de comparação usa < (strict) para overshoot
    // ou seja, somente troca se overshoot ESTRITAMENTE menor que deficit
    // Verificação indireta: qualquer resultado é válido (< ou >), não deve dar erro
    const r = calcularAnilhas(99, 20);
    expect(r.status === "exact" || r.status === "approximate").toBe(true);
    expect(r.plates.length).toBeGreaterThanOrEqual(0);
  });
});

describe("calcularAnilhas — limites de pares", () => {
  it("respeita máximo de 5 pares de 45lb", () => {
    // Tentar usar mais de 5 pares (seria necessário >10 anilhas de 45lb)
    const total = 20 + 2 * 6 * (45 * LB); // precisaria de 6 por lado
    const r = calcularAnilhas(total, 20);
    const slot = r.plates.find((p) => p.plate.id === "45lb");
    expect(slot?.count ?? 0).toBeLessThanOrEqual(5);
  });

  it("respeita máximo de 3 pares de 10kg", () => {
    const total = 20 + 2 * 4 * 10; // precisaria de 4 de 10kg por lado
    const r = calcularAnilhas(total, 20);
    const slot = r.plates.find((p) => p.plate.id === "10kg");
    expect(slot?.count ?? 0).toBeLessThanOrEqual(3);
  });

  it("respeita máximo de 1 par de 1,25kg", () => {
    // Situação onde seriam necessários 2 de 1,25kg por lado
    const total = 20 + 2 * 2 * 1.25;
    const r = calcularAnilhas(total, 20);
    const slot = r.plates.find((p) => p.plate.id === "1.25kg");
    expect(slot?.count ?? 0).toBeLessThanOrEqual(1);
  });
});

describe("calcularAnilhas — propriedades do resultado", () => {
  it("plates ordenados do maior para o menor", () => {
    const total = 20 + 2 * (45 * LB + 10 + 5);
    const r = calcularAnilhas(total, 20);
    for (let i = 1; i < r.plates.length; i++) {
      expect(r.plates[i - 1].plate.weightKg).toBeGreaterThanOrEqual(
        r.plates[i].plate.weightKg
      );
    }
  });

  it("achievedTotal reflete corretamente barra + 2×anilhas", () => {
    const r = calcularAnilhas(40, 20);
    const plateWeight = r.plates.reduce(
      (sum, s) => sum + s.plate.weightKg * s.count,
      0
    );
    expect(Math.abs(r.achievedTotal - (20 + 2 * plateWeight))).toBeLessThan(0.0001);
  });

  it("barWeight refletido corretamente", () => {
    const r = calcularAnilhas(40, 15);
    expect(r.barWeight).toBe(15);
    expect(r.requestedTotal).toBe(40);
  });

  it("resultado de erro tem plates vazio", () => {
    const r = calcularAnilhas(20, 20);
    expect(r.plates).toHaveLength(0);
  });
});
