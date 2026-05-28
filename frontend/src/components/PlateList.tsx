import type { PlateSlot } from "@/lib/types";

interface PlateListProps {
  plates: PlateSlot[];
}

export default function PlateList({ plates }: PlateListProps) {
  if (plates.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "0.75rem",
          color: "#888888",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "0.25rem",
        }}
      >
        Anilhas por lado
      </span>
      {plates.map(({ plate, count }) => (
        <div
          key={plate.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontFamily: "var(--font-condensed)",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background:
                plate.unit === "kg"
                  ? "linear-gradient(180deg, #2a2a2a 0%, #111111 100%)"
                  : plate.color,
              border:
                plate.id === "10lb"
                  ? "2px solid #555555"
                  : plate.unit === "kg"
                  ? "2px solid #b0b8c1"
                  : "none",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#f0f0f0",
              letterSpacing: "0.02em",
            }}
          >
            {count}×
          </span>
          <span
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: "#f0f0f0",
            }}
          >
            {plate.label}
          </span>
        </div>
      ))}
    </div>
  );
}
