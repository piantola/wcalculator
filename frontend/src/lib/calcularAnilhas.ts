import { PLATE_CATALOG } from "./plates";
import type { CalcResult, PlateSlot } from "./types";

const TOLERANCE = 0.01;

export function calcularAnilhas(
  totalWeightKg: number,
  barWeightKg: 15 | 20
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
    const count = Math.min(
      plate.pairs,
      Math.floor((remaining + TOLERANCE) / plate.weightKg)
    );
    if (count > 0) {
      remaining -= count * plate.weightKg;
      plates.push({ plate, count });
    }
  }

  const achievedPerSide = weightPerSide - remaining;
  const achievedTotal = barWeightKg + 2 * achievedPerSide;
  const residualKg = achievedTotal - totalWeightKg;
  const status = Math.abs(residualKg) <= TOLERANCE ? "exact" : "approximate";

  return { status, plates, achievedTotal, requestedTotal: totalWeightKg, barWeight: barWeightKg, residualKg };
}

function error(barWeight: 15 | 20, requestedTotal: number, errorMessage: string): CalcResult {
  return {
    status: "error",
    plates: [],
    achievedTotal: 0,
    requestedTotal,
    barWeight,
    residualKg: 0,
    errorMessage,
  };
}
