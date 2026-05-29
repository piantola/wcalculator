"use client";

import { useState } from "react";
import { calcularAnilhas } from "@/lib/calcularAnilhas";
import type { CalcResult } from "@/lib/types";
import BarSelector from "@/components/BarSelector";
import WeightInput from "@/components/WeightInput";
import ResultPanel from "@/components/ResultPanel";
import DeltaSection from "@/components/DeltaSection";

function parseWeight(raw: string): number {
  return parseFloat(raw.replace(",", ".").trim());
}

export default function Home() {
  const [barWeight, setBarWeight] = useState<15 | 20>(20);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deltaKey, setDeltaKey] = useState(0); // força remount ao limpar delta

  function handleWeightChange(raw: string) {
    setInputValue(raw);
    setDeltaKey((k) => k + 1); // limpa DeltaSection
    if (raw.trim() === "") {
      setResult(null);
      setErrorMsg(null);
      return;
    }
    const kg = parseWeight(raw);
    if (!isFinite(kg) || isNaN(kg)) {
      setResult(null);
      setErrorMsg("Valor inválido.");
      return;
    }
    const r = calcularAnilhas(kg, barWeight);
    if (r.status === "error") {
      setResult(null);
      setErrorMsg(r.errorMessage ?? "Erro.");
    } else {
      setResult(r);
      setErrorMsg(null);
    }
  }

  function handleBarChange(w: 15 | 20) {
    setBarWeight(w);
    if (inputValue.trim() !== "") {
      const kg = parseWeight(inputValue);
      if (isFinite(kg) && !isNaN(kg)) {
        const r = calcularAnilhas(kg, w);
        if (r.status === "error") {
          setResult(null);
          setErrorMsg(r.errorMessage ?? "Erro.");
        } else {
          setResult(r);
          setErrorMsg(null);
        }
      }
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
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <header>
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
            Calculadora de Anilhas
          </h1>
        </header>

        <BarSelector value={barWeight} onChange={handleBarChange} />

        <WeightInput value={inputValue} onChange={handleWeightChange} />

        {errorMsg && (
          <p
            role="alert"
            data-testid="error-message"
            style={{
              fontFamily: "var(--font-condensed)",
              color: "#ff6b6b",
              fontSize: "1rem",
              margin: 0,
            }}
          >
            {errorMsg}
          </p>
        )}

        {result && <ResultPanel result={result} />}
        {result && result.status !== "error" && (
          <DeltaSection key={deltaKey} current={result} />
        )}
      </div>
    </main>
  );
}
