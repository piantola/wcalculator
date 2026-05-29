"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Stock = Record<string, number>; // plateId → total plates (always even)

export const DEFAULT_STOCK: Stock = {
  "45lb":   10,
  "35lb":   10,
  "25lb":   10,
  "15lb":   10,
  "10lb":   10,
  "10kg":    6,
  "5kg":     4,
  "2.5kg":   2,
  "1.25kg":  2,
};

const LS_KEY = "wcalculator-stock";

interface StockCtx {
  stock: Stock;
  stockVersion: number;
  setPlateTotal: (id: string, total: number) => void;
  resetStock: () => void;
}

const StockContext = createContext<StockCtx>({
  stock: DEFAULT_STOCK,
  stockVersion: 0,
  setPlateTotal: () => {},
  resetStock: () => {},
});

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stock, setStock] = useState<Stock>(DEFAULT_STOCK);
  const [version, setVersion] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        setStock({ ...DEFAULT_STOCK, ...parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (s: Stock) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  };

  const setPlateTotal = useCallback((id: string, raw: number) => {
    const total = Math.max(0, Math.min(98, Math.floor(raw / 2) * 2));
    setStock((prev) => {
      const next = { ...prev, [id]: total };
      persist(next);
      return next;
    });
    setVersion((v) => v + 1);
    try { sessionStorage.setItem("stockEdited", "1"); } catch { /* ignore */ }
  }, []);

  const resetStock = useCallback(() => {
    setStock(DEFAULT_STOCK);
    setVersion((v) => v + 1);
    persist(DEFAULT_STOCK);
    try { sessionStorage.setItem("stockEdited", "1"); } catch { /* ignore */ }
  }, []);

  return (
    <StockContext.Provider value={{ stock, stockVersion: version, setPlateTotal, resetStock }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  return useContext(StockContext);
}

/** Converte stock (total de placas) para pares (usado nos cálculos). */
export function stockToPairs(stock: Stock): Record<string, number> {
  return Object.fromEntries(
    Object.entries(stock).map(([id, n]) => [id, Math.floor(n / 2)])
  );
}
