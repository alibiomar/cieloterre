"use client";

import { createContext, useCallback, useContext, useState } from "react";

type NotifyFn = (message: string) => void;
const NotifyContext = createContext<NotifyFn>(() => {});

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState("");

  const notify = useCallback<NotifyFn>((message) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? "" : current)), 3000);
  }, []);

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      {notice && (
        <button
          onClick={() => setNotice("")}
          className="fixed bottom-6 right-6 z-[60] rounded-xl bg-earth px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl"
        >
          {notice}
        </button>
      )}
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}
