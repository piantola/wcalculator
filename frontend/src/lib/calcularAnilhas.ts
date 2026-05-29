import { PLATE_CATALOG } from "./plates";
import type { CalcResult, PlateDefinition, PlateSlot } from "./types";

const TOLERANCE = 0.01;

export function calcularAnilhas(
  totalWeightKg: number,
  barWeightKg: 15 | 20,
  stockPairs?: Record<string, number>
): CalcResult {
  if (!isFinite(totalWeightKg) || totalWeightKg <= 0) {
    return error(barWeightKg, totalWeightKg, "Peso inválido.");
  }
  if (totalWeightKg <= barWeightKg) {
    return error(
      barWeightKg,
      totalWeightKg,
      `O peso informado deve ser maior que o peso da barra (${barWeightKg} kg).`
    );
  }

  const weightPerSide = (totalWeightKg - barWeightKg) / 2;
  let remaining = weightPerSide;
  const plates: PlateSlot[] = [];

  for (const plate of PLATE_CATALOG) {
    if (remaining < TOLERANCE) break;
    const maxCount = stockPairs?.[plate.id] ?? plate.pairs;
    const count = Math.min(maxCount, Math.floor((remaining + TOLERANCE) / plate.weightKg));
    if (count > 0) {
      remaining -= count * plate.weightKg;
      plates.push({ plate, count });
    }
  }

  if (remaining > TOLERANCE) {
    const usedPairs = new Map(plates.map((s) => [s.plate.id, s.count]));
    const smallest = findSmallestAvailable(usedPairs, stockPairs);
    if (smallest) {
      const overshoot = smallest.weightKg - remaining;
      if (overshoot < remaining) {
        addPlate(plates, smallest);
        remaining -= smallest.weightKg;
      }
    }
  }

  const achievedPerSide = weightPerSide - remaining;
  const achievedTotal = barWeightKg + 2 * achievedPerSide;
  const residualKg = achievedTotal - totalWeightKg;
  const status = Math.abs(residualKg) <= TOLERANCE ? "exact" : "approximate";

  return { status, plates, achievedTotal, requestedTotal: totalWeightKg, barWeight: barWeightKg, residualKg };
}

function findSmallestAvailable(
  usedPairs: Map<string, number>,
  stockPairs?: Record<string, number>
): PlateDefinition | null {
  for (let i = PLATE_CATALOG.length - 1; i >= 0; i--) {
    const plate = PLATE_CATALOG[i];
    const used = usedPairs.get(plate.id) ?? 0;
    const maxCount = stockPairs?.[plate.id] ?? plate.pairs;
    if (used < maxCount) return plate;
  }
  return null;
}

function addPlate(plates: PlateSlot[], plate: PlateDefinition): void {
  const existing = plates.find((s) => s.plate.id === plate.id);
  if (existing) { existing.count += 1; return; }
  const idx = plates.findIndex((s) => s.plate.weightKg < plate.weightKg);
  if (idx === -1) plates.push({ plate, count: 1 });
  else plates.splice(idx, 0, { plate, count: 1 });
}

function error(barWeight: 15 | 20, requestedTotal: number, errorMessage: string): CalcResult {
  return { status: "error", plates: [], achievedTotal: 0, requestedTotal, barWeight, residualKg: 0, errorMessage };
}
