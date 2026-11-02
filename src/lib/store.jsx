import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";

/* ---------------- cart ----------------
   Per-viewer convenience state: lives in localStorage when it can, in memory when it can't.
   Checkout hands each line to penumbrafoundation.org — this concept never takes payment. */

const CartCtx = createContext(null);
const KEY = "pf-cart-v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function reducer(lines, a) {
  switch (a.type) {
    case "add": {
      const i = lines.findIndex((l) => l.key === a.line.key);
      if (i >= 0) return lines.map((l, j) => (j === i ? { ...l, qty: Math.min(99, l.qty + a.line.qty) } : l));
      return [...lines, a.line];
    }
    case "qty":
      return lines.map((l) => (l.key === a.key ? { ...l, qty: Math.max(1, Math.min(99, a.qty)) } : l));
    case "remove":
      return lines.filter((l) => l.key !== a.key);
    case "clear":
      return [];
    default:
      return lines;
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* blocked storage: cart stays in memory */ }
  }, [lines]);
  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + (l.price || 0) * l.qty, 0);
    return {
      lines, count, subtotal,
      add: (line) => dispatch({ type: "add", line }),
      setQty: (key, qty) => dispatch({ type: "qty", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [lines]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);

/* ---------------- ui: dialogs + toast ---------------- */
const UICtx = createContext(null);

export function UIProvider({ children }) {
  const cartRef = useRef(null);
  const searchRef = useRef(null);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const openCart = useCallback(() => { const d = cartRef.current; if (d && !d.open) d.showModal(); }, []);
  const closeCart = useCallback(() => cartRef.current?.close(), []);
  const openSearch = useCallback(() => { const d = searchRef.current; if (d && !d.open) d.showModal(); }, []);
  const closeSearch = useCallback(() => searchRef.current?.close(), []);
  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target?.tagName || "") || e.target?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  const value = useMemo(() => ({ cartRef, searchRef, openCart, closeCart, openSearch, closeSearch, say }), [openCart, closeCart, openSearch, closeSearch, say]);
  return (
    <UICtx.Provider value={value}>
      {children}
      <div className={toast ? "toast" : "visually-hidden"} role="status" aria-live="polite">{toast}</div>
    </UICtx.Provider>
  );
}

export const useUI = () => useContext(UICtx);
