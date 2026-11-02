import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const KEY = 'custompen.cart.v1'
const CartCtx = createContext(null)

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(read)
  const [last, setLast] = useState(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable — cart lives in memory */
    }
  }, [items])

  const open = useCallback(() => {
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
  }, [])
  const close = useCallback(() => dialogRef.current?.close(), [])

  const add = useCallback(
    (item) => {
      setItems((cur) => {
        const i = cur.findIndex((x) => x.key === item.key)
        if (i >= 0) {
          const next = cur.slice()
          next[i] = { ...next[i], qty: Math.min(9, next[i].qty + (item.qty || 1)) }
          return next
        }
        return [...cur, { ...item, qty: item.qty || 1 }]
      })
      setLast(item.key)
      requestAnimationFrame(open)
    },
    [open],
  )
  const remove = useCallback((key) => setItems((cur) => cur.filter((x) => x.key !== key)), [])
  const setQty = useCallback(
    (key, qty) => setItems((cur) => cur.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(9, qty)) } : x))),
    [],
  )
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((a, b) => a + b.qty, 0)
    const subtotal = items.reduce((a, b) => a + b.qty * b.price, 0)
    const physical = items.some((x) => x.physical)
    return { items, count, subtotal, physical, add, remove, setQty, clear, open, close, dialogRef, last }
  }, [items, add, remove, setQty, clear, open, close, last])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export const useCart = () => useContext(CartCtx)
