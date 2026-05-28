import type { PlateDefinition } from "./types";

const LB = 0.453592;

export const PLATE_CATALOG: readonly PlateDefinition[] = [
  { id: "45lb",   weightKg: 45 * LB, unit: "lb", pairs: 5, color: "#209dd7", labelColor: "#ffffff", label: "45 lb"   },
  { id: "35lb",   weightKg: 35 * LB, unit: "lb", pairs: 5, color: "#ecad0a", labelColor: "#032147", label: "35 lb"   },
  { id: "25lb",   weightKg: 25 * LB, unit: "lb", pairs: 5, color: "#2e9e5b", labelColor: "#ffffff", label: "25 lb"   },
  { id: "10kg",   weightKg: 10,      unit: "kg", pairs: 3, color: "#1a1a1a", labelColor: "#ecad0a", label: "10 kg"   },
  { id: "15lb",   weightKg: 15 * LB, unit: "lb", pairs: 5, color: "#9e9e9e", labelColor: "#032147", label: "15 lb"   },
  { id: "5kg",    weightKg: 5,       unit: "kg", pairs: 2, color: "#1a1a1a", labelColor: "#ecad0a", label: "5 kg"    },
  { id: "10lb",   weightKg: 10 * LB, unit: "lb", pairs: 5, color: "#f0f0f0", labelColor: "#032147", label: "10 lb"   },
  { id: "2.5kg",  weightKg: 2.5,     unit: "kg", pairs: 1, color: "#1a1a1a", labelColor: "#ecad0a", label: "2,5 kg"  },
  { id: "1.25kg", weightKg: 1.25,    unit: "kg", pairs: 1, color: "#1a1a1a", labelColor: "#ecad0a", label: "1,25 kg" },
] as const;
