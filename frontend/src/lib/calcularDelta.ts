import { PLATE_CATALOG } from "./plates";
import type { DeltaResult, PlateDefinition, PlateSlot } from "./types";

const TOLERANCE = 0.01;

// Fixas: nunca saem da barra uma vez colocadas
const FIXED = new Set(["45lb", "35lb", "25lb", "15lb", "10lb", "10kg"]);

/**
 * Calcula o delta entre a configuração atual da barra e um novo peso alvo.
 *
 * @param currentPlates  Anilhas atualmente na barra (configuração acumulada)
 * @param barWeight      Peso da barra (15 ou 20 kg)
 * @param prevAchieved   Peso total efetivamente atingido na carga anterior
 * @param newTotalKg     Novo peso total desejado (deve ser > prevAchieved)
 */
export function calcularDelta(
  currentPlates: PlateSlot[],
  barWeight: 15 | 20,
  prevAchieved: number,
  newTotalKg: number,
  stockPairs?: Record<string, number>
): DeltaResult {
  if (!isFinite(newTotalKg) || newTotalKg <= 0) {
    return err(newTotalKg, "Peso inválido.");
  }
  if (newTotalKg <= prevAchieved) {
    const fmt = (n: number) =>
      n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
    return err(
      newTotalKg,
      `O novo peso deve ser maior que ${fmt(prevAchieved)} kg.`
    );
  }

  const newWeightPerSide = (newTotalKg - barWeight) / 2;

  // Separa fixas e removíveis da config atual
  const currentFixed = new Map<string, PlateSlot>();
  const currentRemovable = new Map<string, PlateSlot>();
  for (const slot of currentPlates) {
    (FIXED.has(slot.plate.id) ? currentFixed : currentRemovable).set(
      slot.plate.id,
      slot
    );
  }

  // — Caminho A: greedy completo com estoque cheio —
  const fullCatalog = PLATE_CATALOG.map((p) => ({
    plate: p,
    maxCount: stockPairs?.[p.id] ?? p.pairs,
  }));
  const { plates: pathAPlates, remaining: pathARemaining } = runGreedy(
    newWeightPerSide,
    fullCatalog
  );
  const pathAFinal = applyOvershoot(pathAPlates, pathARemaining, fullCatalog);

  // Verifica se todas as fixas atuais estão mantidas ou superadas no caminho A
  const pathAMap = new Map(pathAPlates.map((s) => [s.plate.id, s.count]));
  const allFixed = [...currentFixed.values()].every(
    (s) => (pathAMap.get(s.plate.id) ?? 0) >= s.count
  );

  if (allFixed) {
    return buildPathA(
      currentPlates,
      pathAPlates,
      pathAFinal,
      newTotalKg,
      barWeight,
      newWeightPerSide
    );
  }

  // — Caminho B: trava fixas, libera removíveis, greedy no peso restante —
  const fixedWeightPerSide = [...currentFixed.values()].reduce(
    (s, slot) => s + slot.plate.weightKg * slot.count,
    0
  );
  const remainingNeeded = newWeightPerSide - fixedWeightPerSide;

  const modCatalog = PLATE_CATALOG.map((p) => ({
    plate: p,
    maxCount: FIXED.has(p.id)
      ? (stockPairs?.[p.id] ?? p.pairs) - (currentFixed.get(p.id)?.count ?? 0)
      : (stockPairs?.[p.id] ?? p.pairs),
  }));

  const { plates: deltaPlates, remaining: deltaRemaining } = runGreedy(
    remainingNeeded,
    modCatalog
  );
  const deltaFinal = applyOvershoot(deltaPlates, deltaRemaining, modCatalog);

  // Delta líquido em relação às removíveis atuais
  const deltaMap = new Map(deltaPlates.map((s) => [s.plate.id, s.count]));
  const toAdd: PlateSlot[] = [];
  const toRemove: PlateSlot[] = [];

  for (const slot of deltaPlates) {
    if (FIXED.has(slot.plate.id)) toAdd.push(slot);
  }
  for (const plate of PLATE_CATALOG) {
    if (FIXED.has(plate.id)) continue;
    const cur = currentRemovable.get(plate.id)?.count ?? 0;
    const nxt = deltaMap.get(plate.id) ?? 0;
    if (nxt > cur) toAdd.push({ plate, count: nxt - cur });
    else if (cur > nxt) toRemove.push({ plate, count: cur - nxt });
  }

  toAdd.sort((a, b) => b.plate.weightKg - a.plate.weightKg);

  const newAchievedTotal =
    barWeight + 2 * (fixedWeightPerSide + (remainingNeeded - deltaFinal));
  const residualKg = newAchievedTotal - newTotalKg;
  const status = Math.abs(residualKg) <= TOLERANCE ? "exact" : "approximate";
  const newPlates = mergePlates([...currentFixed.values(), ...deltaPlates]);

  return { status, toAdd, toRemove, newPlates, newAchievedTotal, requestedTotal: newTotalKg, residualKg };
}

// ─── helpers internos ────────────────────────────────────────────────────────

function buildPathA(
  currentPlates: PlateSlot[],
  newPlates: PlateSlot[],
  finalRemaining: number,
  newTotalKg: number,
  barWeight: 15 | 20,
  newWeightPerSide: number
): DeltaResult {
  const curMap = new Map(currentPlates.map((s) => [s.plate.id, s]));
  const newMap = new Map(newPlates.map((s) => [s.plate.id, s]));
  const toAdd: PlateSlot[] = [];
  const toRemove: PlateSlot[] = [];

  for (const [id, ns] of newMap) {
    const diff = ns.count - (curMap.get(id)?.count ?? 0);
    if (diff > 0) toAdd.push({ plate: ns.plate, count: diff });
  }
  for (const [id, cs] of curMap) {
    if (!FIXED.has(id)) {
      const diff = cs.count - (newMap.get(id)?.count ?? 0);
      if (diff > 0) toRemove.push({ plate: cs.plate, count: diff });
    }
  }

  toAdd.sort((a, b) => b.plate.weightKg - a.plate.weightKg);

  const newAchievedTotal = barWeight + 2 * (newWeightPerSide - finalRemaining);
  const residualKg = newAchievedTotal - newTotalKg;
  const status = Math.abs(residualKg) <= TOLERANCE ? "exact" : "approximate";

  return { status, toAdd, toRemove, newPlates, newAchievedTotal, requestedTotal: newTotalKg, residualKg };
}

function runGreedy(
  weightPerSide: number,
  catalog: ReadonlyArray<{ plate: PlateDefinition; maxCount: number }>
): { plates: PlateSlot[]; remaining: number } {
  let remaining = weightPerSide;
  const plates: PlateSlot[] = [];
  for (const { plate, maxCount } of catalog) {
    if (remaining < TOLERANCE) break;
    if (maxCount <= 0) continue;
    const count = Math.min(maxCount, Math.floor((remaining + TOLERANCE) / plate.weightKg));
    if (count > 0) {
      remaining -= count * plate.weightKg;
      plates.push({ plate, count });
    }
  }
  return { plates, remaining };
}

function applyOvershoot(
  plates: PlateSlot[],
  remaining: number,
  catalog: ReadonlyArray<{ plate: PlateDefinition; maxCount: number }>
): number {
  if (remaining <= TOLERANCE) return remaining;
  const used = new Map(plates.map((s) => [s.plate.id, s.count]));
  for (let i = catalog.length - 1; i >= 0; i--) {
    const { plate, maxCount } = catalog[i];
    if ((used.get(plate.id) ?? 0) < maxCount) {
      const overshoot = plate.weightKg - remaining;
      if (overshoot < remaining) {
        insertPlate(plates, plate);
        return remaining - plate.weightKg;
      }
      break;
    }
  }
  return remaining;
}

function mergePlates(slots: PlateSlot[]): PlateSlot[] {
  const map = new Map<string, PlateSlot>();
  for (const s of slots) {
    const ex = map.get(s.plate.id);
    if (ex) ex.count += s.count;
    else map.set(s.plate.id, { plate: s.plate, count: s.count });
  }
  return [...map.values()].sort((a, b) => b.plate.weightKg - a.plate.weightKg);
}

function insertPlate(plates: PlateSlot[], plate: PlateDefinition): void {
  const ex = plates.find((s) => s.plate.id === plate.id);
  if (ex) { ex.count += 1; return; }
  const idx = plates.findIndex((s) => s.plate.weightKg < plate.weightKg);
  if (idx === -1) plates.push({ plate, count: 1 });
  else plates.splice(idx, 0, { plate, count: 1 });
}

function err(requestedTotal: number, errorMessage: string): DeltaResult {
  return {
    status: "error",
    toAdd: [],
    toRemove: [],
    newPlates: [],
    newAchievedTotal: 0,
    requestedTotal,
    residualKg: 0,
    errorMessage,
  };
}
