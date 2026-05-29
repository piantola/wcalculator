export type PlateUnit = "lb" | "kg";

export interface PlateDefinition {
  id: string;
  weightKg: number;
  unit: PlateUnit;
  pairs: number;
  color: string;
  labelColor: string;
  label: string;
}

export interface PlateSlot {
  plate: PlateDefinition;
  count: number;
}

export type CalcStatus = "exact" | "approximate" | "error";

export interface CalcResult {
  status: CalcStatus;
  plates: PlateSlot[];
  achievedTotal: number;
  requestedTotal: number;
  barWeight: number;
  residualKg: number;
  errorMessage?: string;
}

export interface DeltaResult {
  status: CalcStatus;
  toAdd: PlateSlot[];
  toRemove: PlateSlot[];
  newPlates: PlateSlot[];
  newAchievedTotal: number;
  requestedTotal: number;
  residualKg: number;
  errorMessage?: string;
}
