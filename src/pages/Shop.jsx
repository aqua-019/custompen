import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../lib/data'
import { ProductCard, Crumbs, Loading } from '../components/Cards'
import L from '../components/L'

// 17 Squarespace categories for 64 products → five shelves a visitor understands.
const SHELVES = [
  ['Books & photobooks', /Books|Photobooks|Monographs|Publications|Risograph photobook/],
  ['Prints & editions', /Prints|Photogram|Artists|Workspace|Roberto Huarcaya|Risograph Residency|Risograph$/],
  ['Gifts', /Gift Certificate|Tintype Studio/],
  ['Programs', /Long Term Program|Public Programs/],
]
function shelfOf(p) {
  if (/gift|membership|tote|tee/i.test(p.title)) return 'Gifts'
  if (/LONG TERM/i.test(p.title)) return 'Programs'
  if (/photogravure|portfolio|prints?\b|cliché/i.test(p.title) && !/\bbook\b/i.test(p.title)) return 'Prints & editions'
  for (const [name, rx] of SHELVES) if (p.cats.some((c) => rx.test(c))) return name
  return 'Books & photobooks'
}
export const planBase = (t) => t.replace(/\s*x\d+\s*$/i, '').replace(/\s+/g, ' ').trim()
const SORTS = { featured: 'Featured', 'price-asc': 'Price, low to high', 'price-desc': 'Price, high to low', new: 'Newest' }

export default function Shop() {
  const { data } = useData('/data/penumbra-store.json')
  const [sp, setSp] = useSearchParams()
  const shelf = sp.get('shelf') || ''
  const sort = sp.get('sort') || 'featured'
  const all = sp.get('all') === '1'
  const cat = sp.get('category') || ''

  // Payment-plan variants (x12, x6, x2, x1) arrive as separate products; group them into one card.
  const items = useMemo(() => {
    const out = []
    const seen = new Map()
    for (const p of data?.items || []) {
      if (/domestic shipping/i.test(p.title)) continue
      const base = planBase(p.title)
      if (base !== p.title.replace(/\s+/g, ' ').trim()) {
        if (seen.has(base)) {
          const g = seen.get(base)
          g.plans += 1
          g.from = Math.min(g.from, p.from)
          g.soldOut = g.soldOut && p.soldOut
          continue
        }
        const g = { ...p, title: base.replace(/^LONG TERM PROGRAM: THE PHOTOBOOK/i, 'Long Term Program: The Photobook'), plans: 1, shelf: shelfOf(p) }
        seen.set(base, g)
        out.push(g)
        continue
      }
      out.push({ ...p, shelf: shelfOf(p) })
    }
    return out
  }, [data])
  const list = useMemo(() => {
    let l = items.filter((p) => (all || !p.soldOut) && (!shelf || p.shelf === shelf) && (!cat || p.cats.includes(cat)))
    if (sort === 'price-asc') l = l.slice().sort((a, b) => a.from - b.from)
    if (sort === 'price-desc') l = l.slice().sort((a, b) => b.from - a.from)
    if (sort === 'new') l = l.slice().sort((a, b) => (b.added || 0) - (a.added || 0))
    return l
  }, [items, shelf, sort, all, cat])
  const inStock = items.filter((p) => !p.soldOut).length

  useEffect(() => {
    document.title = `Shop${shelf ? ': ' + shelf : ''}${cat ? ': ' + cat : ''} — Penumbra Foundation`
  }, [shelf, cat])

  const set = (k, v) => {
    const n = new URLSearchParams(sp)
    if (!v || n.get(k) === v) n.delete(k)
    else n.set(k, v)
    if (k === 'shelf') n.delete('category')
    setSp(n, { replace: true, preventScrollReset: true })
  }
  if (!data) return <Loading label="Loading the shop" />

  return (
    <div className="shell page">
      <Crumbs trail={[{ label: 'Shop' }]} />
      <header className="idx-hd">
        <p className="kicker">Bookstore &amp; merchandise</p>
        <h1 className="display display--md">Shop</h1>
        <p className="idx-hd__count">
          <span className="count mono">{inStock}</span> books, prints and editions in stock · all proceeds go toward supporting our programming
        </p>
      </header>
      <div className="shopbar">
        <div className="tags" role="group" aria-label="Shelf">
          <button className="tag" aria-pressed={!shelf && !cat} onClick={() => { const n = new URLSearchParams(sp); n.delete('shelf'); n.delete('category'); setSp(n, { replace: true }) }}>All</button>
          {SHELVES.map(([s]) => (
            <button key={s} className="tag" aria-pressed={shelf === s} onClick={() => set('shelf', s)}>
              {s} <span className="mono">{items.filter((p) => p.shelf === s && (all || !p.soldOut)).length}</span>
            </button>
          ))}
          {cat && <button className="tag" aria-pressed="true" onClick={() => set('category', '')}>{cat} ×</button>}
        </div>
        <div className="shopbar__r">
          <label className="switch">
            <input type="checkbox" checked={all} onChange={() => set('all', all ? '' : '1')} />
            <span>Include sold-out archive</span>
          </label>
          <label className="selectlbl">
            <span className="sr">Sort</span>
            <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
      </div>
      <p className="results-n mono">{list.length} items</p>
      <div className="pgrid">
        {list.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
      <aside className="shopnote">
        <p className="kicker">Looking for a gift?</p>
        <p>
          <L href="/2026-gift-guide">The 2026 Gift Guide</L>, <L href="/penumbra-store/membership">gift a membership</L> or a{' '}
          <L href="/penumbra-store/gift-certificate">gift certificate</L> for workshops and tintype sessions.
        </p>
      </aside>
    </div>
  )
}
