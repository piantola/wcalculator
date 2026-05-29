import { PLATE_CATALOG } from "./plates";
import type { CalcResult, DeltaResult, PlateDefinition, PlateSlot } from "./types";

const TOLERANCE = 0.01;

// Anilhas que nunca saem da barra uma vez colocadas
const FIXED = new Set(["45lb", "35lb", "25lb", "15lb", "10lb", "10kg"]);

export function calcularDelta(current: CalcResult, newTotalKg: number): DeltaResult {
  if (!isFinite(newTotalKg) || newTotalKg <= 0) {
    return err(newTotalKg, "Peso inválido.");
  }
  if (newTotalKg <= current.achievedTotal) {
    const fmt = (n: number) =>
      n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
    return err(
      newTotalKg,
      `O novo peso deve ser maior que ${fmt(current.achievedTotal)} kg.`
    );
  }

  const barWeight = current.barWeight as 15 | 20;
  const newWeightPerSide = (newTotalKg - barWeight) / 2;

  // Separa anilhas fixas e removíveis da config atual
  const currentFixed = new Map<string, PlateSlot>();
  const currentRemovable = new Map<string, PlateSlot>();
  for (const slot of current.plates) {
    (FIXED.has(slot.plate.id) ? currentFixed : currentRemovable).set(
      slot.plate.id,
      slot
    );
  }

  // — Caminho A: greedy completo para o novo peso (estoque cheio) —
  const fullCatalog = PLATE_CATALOG.map((p) => ({ plate: p, maxCount: p.pairs }));
  const { plates: pathAPlates, remaining: pathARemaining } = runGreedy(
    newWeightPerSide,
    fullCatalog
  );
  const pathAFinalRemaining = applyOvershoot(pathAPlates, pathARemaining, fullCatalog);

  // Verifica se todas as fixas da config atual estão presentes em quantidade ≥
  const pathAMap = new Map(pathAPlates.map((s) => [s.plate.id, s.count]));
  const allFixedMaintained = [...currentFixed.values()].every(
    (s) => (pathAMap.get(s.plate.id) ?? 0) >= s.count
  );

  if (allFixedMaintained) {
    return buildFromPathA(
      current,
      pathAPlates,
      pathAFinalRemaining,
      newTotalKg,
      barWeight,
      newWeightPerSide
    );
  }

  // — Caminho B: trava as fixas, libera removíveis, greedy no peso restante —
  const fixedWeightPerSide = [...currentFixed.values()].reduce(
    (s, slot) => s + slot.plate.weightKg * slot.count,
    0
  );
  const remainingNeeded = newWeightPerSide - fixedWeightPerSide;

  // Estoque modificado: fixas têm pares reduzidos; removíveis voltam ao estoque cheio
  const modCatalog = PLATE_CATALOG.map((p) => ({
    plate: p,
    maxCount: FIXED.has(p.id)
      ? p.pairs - (currentFixed.get(p.id)?.count ?? 0)
      : p.pairs,
  }));

  const { plates: deltaPlates, remaining: deltaRemaining } = runGreedy(
    remainingNeeded,
    modCatalog
  );
  const deltaFinalRemaining = applyOvershoot(deltaPlates, deltaRemaining, modCatalog);

  // Calcula toAdd e toRemove como delta líquido em relação às removíveis atuais
  const deltaMap = new Map(deltaPlates.map((s) => [s.plate.id, s.count]));
  const toAdd: PlateSlot[] = [];
  const toRemove: PlateSlot[] = [];

  // Fixas adicionadas pelo greedy do delta (são sempre adições)
  for (const slot of deltaPlates) {
    if (FIXED.has(slot.plate.id)) toAdd.push(slot);
  }

  // Removíveis: delta líquido entre nova alocação e atual
  for (const plate of PLATE_CATALOG) {
    if (FIXED.has(plate.id)) continue;
    const currentCount = currentRemovable.get(plate.id)?.count ?? 0;
    const newCount = deltaMap.get(plate.id) ?? 0;
    if (newCount > currentCount)
      toAdd.push({ plate, count: newCount - currentCount });
    else if (currentCount > newCount)
      toRemove.push({ plate, count: currentCount - newCount });
  }

  toAdd.sort((a, b) => b.plate.weightKg - a.plate.weightKg);

  const deltaWeight = deltaPlates.reduce(
    (s, slot) => s + slot.plate.weightKg * slot.count,
    0
  );
  const newAchievedTotal = barWeight + 2 * (fixedWeightPerSide + deltaWeight);
  const residualKg = newAchievedTotal - newTotalKg + deltaFinalRemaining * 2;
  // residualKg mais preciso: usar o remaining final
  const residualKgFinal = barWeight + 2 * (fixedWeightPerSide + (remainingNeeded - deltaFinalRemaining)) - newTotalKg;
  const status = Math.abs(residualKgFinal) <= TOLERANCE ? "exact" : "approximate";

  return {
    status,
    toAdd,
    toRemove,
    newAchievedTotal: barWeight + 2 * (fixedWeightPerSide + (remainingNeeded - deltaFinalRemaining)),
    requestedTotal: newTotalKg,
    residualKg: residualKgFinal,
  };
}

// — Greedy descrescente com estoque customizado —
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

// Tenta adicionar 1 anilha de menor peso disponível se overshoot < deficit
function applyOvershoot(
  plates: PlateSlot[],
  remaining: number,
  catalog: ReadonlyArray<{ plate: PlateDefinition; maxCount: number }>
): number {
  if (remaining <= TOLERANCE) return remaining;
  const usedMap = new Map(plates.map((s) => [s.plate.id, s.count]));
  for (let i = catalog.length - 1; i >= 0; i--) {
    const { plate, maxCount } = catalog[i];
    if ((usedMap.get(plate.id) ?? 0) < maxCount) {
      const overshoot = plate.weightKg - remaining;
      if (overshoot < remaining) {
        insertPlate(plates, plate);
        return remaining - plate.weightKg;
      }
      break; // menor disponível não ajuda; maiores só pioram
    }
  }
  return remaining;
}

function buildFromPathA(
  current: CalcResult,
  newPlates: PlateSlot[],
  finalRemaining: number,
  newTotalKg: number,
  barWeight: 15 | 20,
  newWeightPerSide: number
): DeltaResult {
  const currentMap = new Map(current.plates.map((s) => [s.plate.id, s]));
  const newMap = new Map(newPlates.map((s) => [s.plate.id, s]));
  const toAdd: PlateSlot[] = [];
  const toRemove: PlateSlot[] = [];

  for (const [id, newSlot] of newMap) {
    const diff = newSlot.count - (currentMap.get(id)?.count ?? 0);
    if (diff > 0) toAdd.push({ plate: newSlot.plate, count: diff });
  }
  for (const [id, curSlot] of currentMap) {
    if (!FIXED.has(id)) {
      const diff = curSlot.count - (newMap.get(id)?.count ?? 0);
      if (diff > 0) toRemove.push({ plate: curSlot.plate, count: diff });
    }
  }

  toAdd.sort((a, b) => b.plate.weightKg - a.plate.weightKg);

  const achievedPerSide = newWeightPerSide - finalRemaining;
  const newAchievedTotal = barWeight + 2 * achievedPerSide;
  const residualKg = newAchievedTotal - newTotalKg;
  const status = Math.abs(residualKg) <= TOLERANCE ? "exact" : "approximate";

  return { status, toAdd, toRemove, newAchievedTotal, requestedTotal: newTotalKg, residualKg };
}

// Insere anilha mantendo ordem decrescente de peso
function insertPlate(plates: PlateSlot[], plate: PlateDefinition): void {
  const existing = plates.find((s) => s.plate.id === plate.id);
  if (existing) { existing.count += 1; return; }
  const idx = plates.findIndex((s) => s.plate.weightKg < plate.weightKg);
  if (idx === -1) plates.push({ plate, count: 1 });
  else plates.splice(idx, 0, { plate, count: 1 });
}

function err(requestedTotal: number, errorMessage: string): DeltaResult {
  return {
    status: "error",
    toAdd: [],
    toRemove: [],
    newAchievedTotal: 0,
    requestedTotal,
    residualKg: 0,
    errorMessage,
  };
}
