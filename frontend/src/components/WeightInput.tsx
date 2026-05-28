interface WeightInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function WeightInput({ value, onChange }: WeightInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label
        htmlFor="weight-input"
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "0.85rem",
          color: "#888888",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Peso total (kg, incluindo a barra)
      </label>
      <input
        id="weight-input"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ex: 100 ou 82,5"
        style={{
          fontFamily: "var(--font-condensed)",
          fontWeight: 600,
          fontSize: "2rem",
          background: "transparent",
          border: "none",
          borderBottom: "2px solid #ecad0a",
          color: "#f0f0f0",
          outline: "none",
          padding: "0.4rem 0",
          width: "100%",
          maxWidth: "280px",
          letterSpacing: "0.04em",
        }}
      />
    </div>
  );
}
