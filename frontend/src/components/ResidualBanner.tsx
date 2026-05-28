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
  requestedTotal,
  residualKg,
}: ResidualBannerProps) {
  const short = residualKg < 0;
  const diff = fmt(residualKg);
  const achieved = achievedTotal.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  const requested = requestedTotal.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

  const message = short
    ? `Peso atingido: ${achieved} kg — faltaram ${diff} kg para os ${requested} kg solicitados`
    : `Peso atingido: ${achieved} kg — excedeu ${diff} kg em relação aos ${requested} kg solicitados`;

  return (
    <div
      role="alert"
      data-testid="residual-banner"
      style={{
        background: "rgba(236,173,10,0.12)",
        border: "1px solid #ecad0a",
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        color: "#ecad0a",
        fontFamily: "var(--font-condensed)",
        fontSize: "1rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
      }}
    >
      {message}
    </div>
  );
}
