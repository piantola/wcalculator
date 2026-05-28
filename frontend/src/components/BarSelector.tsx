interface BarSelectorProps {
  value: 15 | 20;
  onChange: (v: 15 | 20) => void;
}

export default function BarSelector({ value, onChange }: BarSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Peso da barra"
      style={{ display: "flex", gap: "0.75rem" }}
    >
      {([20, 15] as const).map((w) => (
        <button
          key={w}
          type="button"
          aria-pressed={value === w}
          onClick={() => onChange(w)}
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "1.1rem",
            padding: "0.6rem 1.4rem",
            borderRadius: "6px",
            border: value === w ? "2px solid #ecad0a" : "2px solid #444",
            background: value === w ? "#753991" : "transparent",
            color: value === w ? "#ffffff" : "#888888",
            cursor: "pointer",
            transition: "all 0.15s",
            letterSpacing: "0.04em",
          }}
        >
          Barra {w} kg
        </button>
      ))}
    </div>
  );
}
