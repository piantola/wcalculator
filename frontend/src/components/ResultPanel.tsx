import type { CalcResult } from "@/lib/types";
import WeightSummary from "./WeightSummary";
import ResidualBanner from "./ResidualBanner";
import PlateList from "./PlateList";
import BarbellDiagram from "./BarbellDiagram";

interface ResultPanelProps {
  result: CalcResult;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <BarbellDiagram plates={result.plates} barWeight={result.barWeight as 15 | 20} />
      <WeightSummary result={result} />
      {result.status === "approximate" && (
        <ResidualBanner
          achievedTotal={result.achievedTotal}
          requestedTotal={result.requestedTotal}
          residualKg={result.residualKg}
        />
      )}
      <PlateList plates={result.plates} />
    </div>
  );
}
