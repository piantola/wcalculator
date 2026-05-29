"use client";

import { useState } from "react";
import { calcularDelta } from "@/lib/calcularDelta";
import { useStock, stockToPairs } from "@/lib/StockContext";
import type { CalcResult, DeltaResult, PlateSlot } from "@/lib/types";
import PlateList from "@/components/PlateList";

interface Props {
  firstResult: CalcResult;
}

type Slot = {
  inputValue: string;
  error: string | null;
  delta: DeltaResult | null;
};

function ordinal(n: number): string {
  const suffixes = ["", "", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª", "8ª", "9ª", "10ª"];
  return n < suffixes.length ? suffixes[n] : `${n}ª`;
}

function parseWeight(raw: string): number {
  return parseFloat(raw.replace(",", ".").trim());
}

function fmtKg(n: number) {
  return Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export default function CadeiaCargas({ firstResult }: Props) {
  const { stock } = useStock();
  const stockPairs = stockToPairs(stock);

  const [slots, setSlots] = useState<Slot[]>([
    { inputValue: "", error: null, delta: null },
  ]);

  function getBase(i: number): { plates: PlateSlot[]; achievedTotal: number } {
    if (i === 0) {
      return { plates: firstResult.plates, achievedTotal: firstResult.achievedTotal };
    }
    const d = slots[i - 1].delta!;
    return { plates: d.newPlates, achievedTotal: d.newAchievedTotal };
  }

  function handleChange(slotIdx: number, raw: string) {
    const base = getBase(slotIdx);
    const barWeight = firstResult.barWeight as 15 | 20;
    let error: string | null = null;
    let delta: DeltaResult | null = null;

    if (raw.trim() !== "") {
      const kg = parseWeight(raw);
      if (!isFinite(kg) || isNaN(kg)) {
        error = "Valor inválido.";
      } else {
        const r = calcularDelta(base.plates, barWeight, base.achievedTotal, kg, stockPairs);
        if (r.status === "error") error = r.errorMessage ?? "Erro.";
        else delta = r;
      }
    }

    setSlots((prev) => {
      const updated = prev.slice(0, slotIdx + 1);
      updated[slotIdx] = { inputValue: raw, error, delta };
      if (delta !== null) updated.push({ inputValue: "", error: null, delta: null });
      return updated;
    });
  }

  function reset() {
    setSlots([{ inputValue: "", error: null, delta: null }]);
  }

  const hasAny = slots.some((s) => s.delta !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {slots.map((slot, i) => (
        <SlotCard
          key={i}
          n={i + 2}
          slot={slot}
          isActive={i === slots.length - 1}
          baseAchievedTotal={getBase(i).achievedTotal}
          onChange={(v) => handleChange(i, v)}
        />
      ))}

      {hasAny && (
        <button
          onClick={reset}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontFamily: "var(--font-condensed)",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: "0.75rem 0 0",
            textAlign: "left",
          }}
        >
          Reiniciar cadeia
        </button>
      )}
    </div>
  );
}

// ─── Card de cada slot ────────────────────────────────────────────────────────

interface SlotCardProps {
  n: number;
  slot: Slot;
  isActive: boolean;
  baseAchievedTotal: number;
  onChange: (v: string) => void;
}

function SlotCard({ n, slot, isActive, baseAchievedTotal, onChange }: SlotCardProps) {
  return (
    <section
      style={{
        borderTop: "1px solid #1e3a5f",
        paddingTop: "1.75rem",
        paddingBottom: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-condensed)",
          fontWeight: 700,
          fontSize: "1rem",
          color: "#888888",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {ordinal(n)} carga
      </h2>

      {/* Peso: input se ativo, valor estático se já calculado */}
      {isActive ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              htmlFor={`carga-input-${n}`}
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.75rem",
                color: "#888888",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Novo peso total (kg)
            </label>
            <input
              id={`carga-input-${n}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={slot.inputValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`ex: ${Math.ceil(baseAchievedTotal + 10)}`}
              style={{
                fontFamily: "var(--font-condensed)",
                fontWeight: 600,
                fontSize: "2rem",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid #1e3a5f",
                color: "#f0f0f0",
                outline: "none",
                padding: "0.4rem 0",
                width: "100%",
                maxWidth: "280px",
                letterSpacing: "0.04em",
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#209dd7")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#1e3a5f")}
            />
          </div>
          {slot.error && (
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                color: "#ff6b6b",
                fontSize: "0.95rem",
                margin: 0,
              }}
            >
              {slot.error}
            </p>
          )}
        </>
      ) : (
        <div
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 600,
            fontSize: "2rem",
            color: "#f0f0f0",
            letterSpacing: "0.04em",
            opacity: 0.8,
          }}
        >
          {slot.inputValue} kg
        </div>
      )}

      {slot.delta && <DeltaDisplay delta={slot.delta} />}
    </section>
  );
}

// ─── Exibição do resultado do delta ──────────────────────────────────────────

function DeltaDisplay({ delta }: { delta: DeltaResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {delta.status === "approximate" && (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "0.6rem 0.9rem",
            fontFamily: "var(--font-condensed)",
          }}
        >
          <span
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: delta.residualKg > 0 ? "#ff6b6b" : "#ecad0a",
            }}
          >
            {delta.residualKg > 0 ? "Excedeu" : "Faltou"}: {fmtKg(delta.residualKg)} kg
          </span>
        </div>
      )}

      {delta.toRemove.length > 0 && (
        <PlateGroup
          label="Retirar de cada lado"
          slots={delta.toRemove}
          sign="−"
          signColor="#ff6b6b"
        />
      )}

      {delta.toAdd.length > 0 && (
        <PlateGroup
          label="Adicionar de cada lado"
          slots={delta.toAdd}
          sign="+"
          signColor="#4caf7d"
        />
      )}

      {delta.newPlates.length > 0 && (
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: "1rem" }}>
          <PlateList plates={delta.newPlates} />
        </div>
      )}
    </div>
  );
}

// ─── Lista de anilhas a adicionar/retirar ────────────────────────────────────

function PlateGroup({
  label,
  slots,
  sign,
  signColor,
}: {
  label: string;
  slots: PlateSlot[];
  sign: string;
  signColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "0.7rem",
          color: "#888888",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {slots.map(({ plate, count }) => (
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
            style={{
              width: "20px",
              textAlign: "center",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: signColor,
            }}
          >
            {sign}
          </span>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background:
                plate.unit === "kg"
                  ? "linear-gradient(180deg,#2a2a2a 0%,#111111 100%)"
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
            style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f0f0f0" }}
          >
            {count}×
          </span>
          <span
            style={{ fontSize: "1.2rem", fontWeight: 600, color: "#f0f0f0" }}
          >
            {plate.label}
          </span>
        </div>
      ))}
    </div>
  );
}
