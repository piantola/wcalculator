"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { calcularAnilhas } from "@/lib/calcularAnilhas";
import { useStock, stockToPairs } from "@/lib/StockContext";
import type { CalcResult } from "@/lib/types";
import BarSelector from "@/components/BarSelector";
import WeightInput from "@/components/WeightInput";
import ResultPanel from "@/components/ResultPanel";
import CadeiaCargas from "@/components/CadeiaCargas";

function parseWeight(raw: string): number {
  return parseFloat(raw.replace(",", ".").trim());
}

export default function Home() {
  const { stock } = useStock();
  const stockPairs = stockToPairs(stock);

  const [barWeight, setBarWeight] = useState<15 | 20>(20);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chainKey, setChainKey] = useState(0);
  const [stockBanner, setStockBanner] = useState(false);

  // Detectar retorno da tela de estoque via flag de sessionStorage
  useEffect(() => {
    try {
      if (sessionStorage.getItem("stockEdited")) {
        sessionStorage.removeItem("stockEdited");
        setChainKey((k) => k + 1);
        setStockBanner(true);
        const t = setTimeout(() => setStockBanner(false), 4000);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  // Recalcular quando o estoque muda (ex: enquanto na página principal)
  const stockRef = useRef(stockPairs);
  useEffect(() => {
    if (JSON.stringify(stockRef.current) === JSON.stringify(stockPairs)) return;
    stockRef.current = stockPairs;
    if (inputValue.trim() !== "") {
      const kg = parseWeight(inputValue);
      if (isFinite(kg) && !isNaN(kg)) {
        const r = calcularAnilhas(kg, barWeight, stockPairs);
        if (r.status === "error") { setResult(null); setErrorMsg(r.errorMessage ?? "Erro."); }
        else { setResult(r); setErrorMsg(null); }
      }
      setChainKey((k) => k + 1);
    }
  }, [stockPairs]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleWeightChange(raw: string) {
    setInputValue(raw);
    setChainKey((k) => k + 1);
    if (raw.trim() === "") { setResult(null); setErrorMsg(null); return; }
    const kg = parseWeight(raw);
    if (!isFinite(kg) || isNaN(kg)) { setResult(null); setErrorMsg("Valor inválido."); return; }
    const r = calcularAnilhas(kg, barWeight, stockPairs);
    if (r.status === "error") { setResult(null); setErrorMsg(r.errorMessage ?? "Erro."); }
    else { setResult(r); setErrorMsg(null); }
  }

  function handleBarChange(w: 15 | 20) {
    setBarWeight(w);
    if (inputValue.trim() !== "") {
      const kg = parseWeight(inputValue);
      if (isFinite(kg) && !isNaN(kg)) {
        const r = calcularAnilhas(kg, w, stockPairs);
        if (r.status === "error") { setResult(null); setErrorMsg(r.errorMessage ?? "Erro."); }
        else { setResult(r); setErrorMsg(null); }
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
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          <Link
            href="/estoque"
            aria-label="Gerenciar estoque"
            title="Estoque"
            style={{ color: "#888888", textDecoration: "none", fontSize: "1.4rem", lineHeight: 1 }}
          >
            ⚙
          </Link>
        </header>

        {stockBanner && (
          <div
            role="status"
            style={{
              background: "rgba(32,157,215,0.1)",
              border: "1px solid #209dd7",
              borderRadius: "6px",
              padding: "0.6rem 0.9rem",
              fontFamily: "var(--font-condensed)",
              fontSize: "0.9rem",
              color: "#209dd7",
            }}
          >
            Estoque atualizado — a cadeia de cargas foi reiniciada.
          </div>
        )}

        <BarSelector value={barWeight} onChange={handleBarChange} />

        <WeightInput value={inputValue} onChange={handleWeightChange} />

        {errorMsg && (
          <p
            role="alert"
            data-testid="error-message"
            style={{ fontFamily: "var(--font-condensed)", color: "#ff6b6b", fontSize: "1rem", margin: 0 }}
          >
            {errorMsg}
          </p>
        )}

        {result && <ResultPanel result={result} />}
        {result && result.status !== "error" && (
          <CadeiaCargas key={chainKey} firstResult={result} />
        )}
      </div>
    </main>
  );
}
