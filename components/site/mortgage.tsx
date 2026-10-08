"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";

/** Standard annuity formula: M = P·r / (1 − (1 + r)^−n). */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (principal <= 0 || n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

export function MortgageEstimate({ price }: { price: number }) {
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(9);

  const { loan, monthly } = useMemo(() => {
    const loan = price * (1 - down / 100);
    return { loan, monthly: monthlyPayment(loan, rate, years) };
  }, [price, down, years, rate]);

  return (
    <div className="rounded-lg border border-trait bg-surface p-6 sm:p-8">
      <h2 className="ct-h3">Estimer ma mensualité</h2>
      <p className="mt-2 text-muted">Simulation indicative. Votre banque confirmera le taux et les conditions.</p>

      <div className="mt-7 grid gap-6 sm:grid-cols-3">
        <label className="block">
          <span className="ct-fieldlabel flex justify-between"><span>Apport</span><span className="ct-num text-muted">{down} %</span></span>
          <input type="range" min={0} max={70} step={5} value={down} onChange={(e) => setDown(Number(e.target.value))} className="w-full accent-[var(--c-porte)]" />
        </label>
        <label className="block">
          <span className="ct-fieldlabel flex justify-between"><span>Durée</span><span className="ct-num text-muted">{years} ans</span></span>
          <input type="range" min={5} max={25} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-[var(--c-porte)]" />
        </label>
        <label className="block">
          <span className="ct-fieldlabel flex justify-between"><span>Taux annuel</span><span className="ct-num text-muted">{rate.toFixed(1).replace(".", ",")} %</span></span>
          <input type="range" min={3} max={14} step={0.25} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-[var(--c-porte)]" />
        </label>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-trait pt-6">
        <div>
          <p className="text-sm text-muted">Mensualité estimée</p>
          <p className="ct-num text-4xl font-light tracking-tight" aria-live="polite">{formatNumber(monthly)} <span className="text-lg">TND / mois</span></p>
        </div>
        <p className="ct-num text-sm text-muted">Montant emprunté : {formatNumber(loan)} TND</p>
      </div>
    </div>
  );
}
