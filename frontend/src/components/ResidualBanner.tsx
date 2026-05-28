interface ResidualBannerProps {
  achievedTotal: number;
  requestedTotal: number;
  residualKg: number;
}

function fmt(n: number) {
  return Math.abs(n).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export default function ResidualBanner({ residualKg }: ResidualBannerProps) {
  const overshoot = residualKg > 0;

  return (
    <div
      role="alert"
      data-testid="residual-banner"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid #444",
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        fontFamily: "var(--font-condensed)",
      }}
    >
      <span
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: overshoot ? "#ff6b6b" : "#ecad0a",
        }}
      >
        {overshoot ? "Excedeu" : "Faltou"}: {fmt(residualKg)} kg
      </span>
    </div>
  );
}
