import type { CalcResult } from "@/lib/types";

interface WeightSummaryProps {
  result: CalcResult;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export default function WeightSummary({ result }: WeightSummaryProps) {
  const perSide = (result.achievedTotal - result.barWeight) / 2;

  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
        fontFamily: "var(--font-condensed)",
      }}
    >
      <Stat label="Barra" value={`${result.barWeight} kg`} />
      <Stat label="Por lado" value={`${fmt(perSide)} kg`} accent />
      <Stat label="Total atingido" value={`${fmt(result.achievedTotal)} kg`} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span
        style={{
          fontSize: "0.75rem",
          color: "#888888",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          color: accent ? "#ecad0a" : "#f0f0f0",
          letterSpacing: "0.02em",
        }}
      >
        {value}
      </span>
    </div>
  );
}
