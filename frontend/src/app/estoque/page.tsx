"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PLATE_CATALOG } from "@/lib/plates";
import { DEFAULT_STOCK, useStock } from "@/lib/StockContext";
import type { PlateDefinition } from "@/lib/types";

const GROUPS = [
  { label: "Em libras",      plates: PLATE_CATALOG.filter((p) => p.unit === "lb") },
  { label: "Em quilogramas", plates: PLATE_CATALOG.filter((p) => p.unit === "kg") },
];

export default function EstoquePage() {
  const { stock, setPlateTotal, resetStock } = useStock();

  function handleReset() {
    if (window.confirm("Tem certeza? O estoque voltará para as quantidades padrão.")) {
      resetStock();
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#032147",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.25rem",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/"
            aria-label="Voltar"
            style={{
              color: "#888888",
              fontFamily: "var(--font-condensed)",
              fontSize: "1.3rem",
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            ←
          </Link>
          <h1
            style={{
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#ecad0a",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Estoque de Anilhas
          </h1>
        </header>

        {/* Groups */}
        {GROUPS.map((group) => (
          <section key={group.label} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <h2
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.7rem",
                color: "#888888",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: "0 0 0.75rem",
              }}
            >
              {group.label}
            </h2>
            {group.plates.map((plate) => (
              <PlateRow
                key={plate.id}
                plate={plate}
                total={stock[plate.id] ?? DEFAULT_STOCK[plate.id] ?? 0}
                defaultTotal={DEFAULT_STOCK[plate.id] ?? 0}
                onUpdate={(n) => setPlateTotal(plate.id, n)}
              />
            ))}
          </section>
        ))}

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{
            background: "none",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "#888888",
            fontFamily: "var(--font-condensed)",
            fontWeight: 600,
            fontSize: "0.85rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0.65rem 1.25rem",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
        >
          Restaurar padrão
        </button>
      </div>
    </main>
  );
}

// ─── PlateRow ────────────────────────────────────────────────────────────────

interface PlateRowProps {
  plate: PlateDefinition;
  total: number;
  defaultTotal: number;
  onUpdate: (n: number) => void;
}

function PlateRow({ plate, total, onUpdate }: PlateRowProps) {
  const [draft, setDraft] = useState(String(total));
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);
  const adjustTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when total changes externally (reset button, etc.)
  useEffect(() => { setDraft(String(total)); }, [total]);

  function apply(raw: number) {
    const even = Math.max(0, Math.min(98, Math.floor(raw / 2) * 2));
    if (even !== raw) {
      if (adjustTimer.current) clearTimeout(adjustTimer.current);
      setAdjustMsg(`Ajustado para ${even}`);
      adjustTimer.current = setTimeout(() => setAdjustMsg(null), 3000);
    }
    onUpdate(even);
    setDraft(String(even));
  }

  function commitDraft() {
    const n = parseInt(draft, 10);
    if (isNaN(n) || n < 0) { setDraft(String(total)); return; }
    apply(n);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
  }

  const isKg = plate.unit === "kg";
  const dotStyle: React.CSSProperties = {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    flexShrink: 0,
    background: isKg
      ? "linear-gradient(180deg,#2a2a2a 0%,#111111 100%)"
      : plate.color,
    border: isKg
      ? "2px solid #b0b8c1"
      : plate.id === "10lb"
      ? "2px solid #555555"
      : "none",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
        borderBottom: "1px solid #0f2d50",
        padding: "0.75rem 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {/* Color dot */}
        <span aria-hidden style={dotStyle} />

        {/* Name */}
        <span
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 600,
            fontSize: "1.1rem",
            color: "#f0f0f0",
            flex: 1,
          }}
        >
          {plate.label}
        </span>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <StepBtn
            label="−"
            disabled={total <= 0}
            onClick={() => apply(total - 2)}
          />
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={`Quantidade de ${plate.label}`}
            style={{
              width: "44px",
              textAlign: "center",
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "1.2rem",
              background: "transparent",
              border: "1px solid #1e3a5f",
              borderRadius: "4px",
              color: "#f0f0f0",
              padding: "0.25rem 0",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#209dd7")}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#1e3a5f";
              commitDraft();
            }}
          />
          <StepBtn
            label="+"
            disabled={total >= 98}
            onClick={() => apply(total + 2)}
          />
        </div>
      </div>

      {adjustMsg && (
        <span
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "0.75rem",
            color: "#ecad0a",
            paddingLeft: "31px", // align with name
          }}
        >
          {adjustMsg}
        </span>
      )}
    </div>
  );
}

function StepBtn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label === "+" ? "Aumentar" : "Diminuir"}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "6px",
        border: "1px solid #1e3a5f",
        background: "transparent",
        color: disabled ? "#333" : "#f0f0f0",
        fontFamily: "var(--font-condensed)",
        fontWeight: 700,
        fontSize: "1.3rem",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}
