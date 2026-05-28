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
  it("peso impossível (barra + 0.5kg por lado) → approximate", () => {
    const r = calcularAnilhas(21, 20);
    expect(r.status).toBe("approximate");
    expect(r.achievedTotal).toBeGreaterThan(0);
  });

  it("residualKg negativo quando falta peso", () => {
    const r = calcularAnilhas(21, 20);
    expect(r.residualKg).toBeLessThan(0);
  });

  it("achievedTotal + |residual| === requestedTotal (magnitude)", () => {
    const r = calcularAnilhas(21, 20);
    expect(Math.abs(r.achievedTotal - r.requestedTotal - r.residualKg)).toBeLessThan(0.0001);
  });

  it("resultado exato tem residualKg numericamente zero", () => {
    const total = 20 + 2 * (45 * LB + 5);
    const r = calcularAnilhas(total, 20);
    expect(r.status).toBe("exact");
    expect(Math.abs(r.residualKg)).toBeLessThan(0.01);
    expect(r.achievedTotal).toBeCloseTo(total, 3);
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
