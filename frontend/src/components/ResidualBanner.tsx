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

export default function ResidualBanner({
  achievedTotal,
  residualKg,
}: ResidualBannerProps) {
  const overshoot = residualKg > 0;
  const achieved = achievedTotal.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

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
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
      }}
    >
      <span style={{ fontSize: "1rem", fontWeight: 600, color: "#f0f0f0" }}>
        Peso atingido: {achieved} kg
      </span>
      <span
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: overshoot ? "#ff6b6b" : "#f0f0f0",
        }}
      >
        {overshoot ? "Excedeu" : "Faltou"}: {fmt(residualKg)} kg
      </span>
    </div>
  );
}
