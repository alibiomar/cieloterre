"use client";

import { createContext, useContext } from "react";

type LocaleContextValue = { locale: "fr" };
const LocaleContext = createContext<LocaleContextValue>({ locale: "fr" });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocaleContext.Provider value={{ locale: "fr" }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
