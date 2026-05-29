"use client";

import { useState } from "react";
import { calcularDelta } from "@/lib/calcularDelta";
import type { CalcResult, DeltaResult, PlateSlot } from "@/lib/types";

interface DeltaSectionProps {
  current: CalcResult;
}

function parseWeight(raw: string): number {
  return parseFloat(raw.replace(",", ".").trim());
}

function fmt(n: number) {
  return Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export default function DeltaSection({ current }: DeltaSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<DeltaResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleChange(raw: string) {
    setInputValue(raw);
    if (raw.trim() === "") {
      setResult(null);
      setErrorMsg(null);
      return;
    }
    const kg = parseWeight(raw);
    if (!isFinite(kg)) {
      setResult(null);
      setErrorMsg("Valor inválido.");
      return;
    }
    const r = calcularDelta(current, kg);
    if (r.status === "error") {
      setResult(null);
      setErrorMsg(r.errorMessage ?? "Erro.");
    } else {
      setResult(r);
      setErrorMsg(null);
    }
  }

  return (
    <section
      style={{
        borderTop: "1px solid #1e3a5f",
        paddingTop: "1.75rem",
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
        Próxima carga
      </h2>

      {/* Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label
          htmlFor="delta-input"
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
          id="delta-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`ex: ${Math.ceil(current.achievedTotal + 10)}`}
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
          onFocus={(e) =>
            (e.currentTarget.style.borderBottomColor = "#209dd7")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderBottomColor = "#1e3a5f")
          }
        />
      </div>

      {errorMsg && (
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            color: "#ff6b6b",
            fontSize: "0.95rem",
            margin: 0,
          }}
        >
          {errorMsg}
        </p>
      )}

      {result && result.status !== "error" && (
        <DeltaResult result={result} />
      )}
    </section>
  );
}

function DeltaResult({ result }: { result: DeltaResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Residual */}
      {result.status === "approximate" && (
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
              color: result.residualKg > 0 ? "#ff6b6b" : "#ecad0a",
            }}
          >
            {result.residualKg > 0 ? "Excedeu" : "Faltou"}: {fmt(result.residualKg)} kg
          </span>
        </div>
      )}

      {/* Retirar */}
      {result.toRemove.length > 0 && (
        <PlateGroup
          label="Retirar de cada lado"
          slots={result.toRemove}
          sign="−"
          signColor="#ff6b6b"
        />
      )}

      {/* Adicionar */}
      {result.toAdd.length > 0 && (
        <PlateGroup
          label="Adicionar de cada lado"
          slots={result.toAdd}
          sign="+"
          signColor="#4caf7d"
        />
      )}
    </div>
  );
}

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
          <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#f0f0f0" }}>
            {plate.label}
          </span>
        </div>
      ))}
    </div>
  );
}
