import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData, monthOf, formatOf } from '../lib/data'
import { WorkshopCard, Crumbs, Loading } from '../components/Cards'
import Rich from '../components/Rich'
import L from '../components/L'

const TECH_ORDER = ['Alternative Process', 'Wet Plate', 'Platinum Palladium', 'Cyanotype', 'Siderotypes', 'Kallitype', 'B&W Darkroom', 'Large Format', 'Risograph', 'Photobooks', 'Project / Creative Development', 'Historic Photography', 'Plant-Based Processes']
const FORMATS = ['One day', 'Two days', 'Weekly series']

/** D5712 query-key collection browser · D6194 filter-state document title · D5742 holdings count as lede */
export default function Workshops() {
  const { data } = useData('/data/workshops.json')
  const [sp, setSp] = useSearchParams()
  const tech = sp.getAll('technique')
  const fmt = sp.get('format') || ''
  const month = sp.get('month') || ''
  const open = sp.get('open') === '1'
  const level = sp.get('level') || ''
  const q = sp.get('q') || ''

  const items = data?.items || []
  const facets = useMemo(() => {
    const t = new Map()
    const m = new Map()
    for (const w of items) {
      for (const c of w.cats) if (c !== 'Intermediate') t.set(c, (t.get(c) || 0) + 1)
      const mo = monthOf(w.when)
      if (mo) m.set(mo, (m.get(mo) || 0) + 1)
    }
    const rank = (x) => (TECH_ORDER.indexOf(x) < 0 ? 99 : TECH_ORDER.indexOf(x))
    const techs = [...t.entries()].sort((a, b) => rank(a[0]) - rank(b[0]))
    return { techs, months: [...m.entries()] }
  }, [items])

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return items.filter((w) => {
      if (tech.length && !tech.some((t) => w.cats.includes(t))) return false
      if (fmt && formatOf(w) !== fmt) return false
      if (month && monthOf(w.when) !== month) return false
      if (open && w.soldOut) return false
      if (level === 'intermediate' && w.level !== 'Intermediate') return false
      if (level === 'open' && w.level === 'Intermediate') return false
      if (words.length) {
        const hay = `${w.title} ${w.excerpt} ${w.cats.join(' ')}`.toLowerCase()
        if (!words.every((x) => hay.includes(x))) return false
      }
      return true
    })
  }, [items, tech.join('|'), fmt, month, open, level, q])

  const active = [...tech, fmt, month, open ? 'Open only' : '', level === 'intermediate' ? 'Intermediate' : level === 'open' ? 'No prerequisite' : '', q && `“${q}”`].filter(Boolean)
  useEffect(() => {
    document.title = active.length ? `Workshops: ${active.join(', ')} — Penumbra Foundation` : 'Workshops — Penumbra Foundation'
  }, [active.join('|')])

  const set = (k, v, multi) => {
    const next = new URLSearchParams(sp)
    if (multi) {
      const cur = next.getAll(k)
      next.delete(k)
      const vals = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
      vals.forEach((x) => next.append(k, x))
    } else if (!v || next.get(k) === v) next.delete(k)
    else next.set(k, v)
    setSp(next, { replace: true, preventScrollReset: true })
  }

  if (!data) return <Loading label="Loading workshops" />

  return (
    <div className="shell page">
      <Crumbs trail={[{ label: 'Learn', href: '/workshops' }, { label: 'In-person workshops' }]} />
      <header className="idx-hd">
        <p className="kicker">Education · In-person learning</p>
        <h1 className="display display--md">Workshops</h1>
        <p className="idx-hd__count">
          <span className="count mono">{items.length}</span> workshops this season at 36 East 30th Street ·{' '}
          <span className="mono">{items.filter((w) => !w.soldOut).length}</span> open for registration
        </p>
        <Rich className="idx-hd__intro prose" html={data.intro} />
      </header>

      <div className="browse">
        <aside className="filters" aria-label="Filter workshops">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="filters__q">
            <label htmlFor="wq" className="kicker">Search workshops</label>
            <input id="wq" type="search" value={q} placeholder="Cyanotype, Sam Dole…" onChange={(e) => set('q', e.target.value)} />
          </form>
          <fieldset>
            <legend className="kicker">Technique</legend>
            <div className="tags">
              {facets.techs.map(([t, n]) => (
                <button key={t} type="button" className="tag" aria-pressed={tech.includes(t)} onClick={() => set('technique', t, true)}>
                  {t} <span className="mono">{n}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="kicker">Format</legend>
            <div className="tags">
              {FORMATS.map((f) => (
                <button key={f} type="button" className="tag" aria-pressed={fmt === f} onClick={() => set('format', f)}>{f}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="kicker">Month</legend>
            <div className="tags">
              {facets.months.map(([m, n]) => (
                <button key={m} type="button" className="tag" aria-pressed={month === m} onClick={() => set('month', m)}>
                  {m} <span className="mono">{n}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="kicker">Experience</legend>
            <div className="tags">
              <button type="button" className="tag" aria-pressed={level === 'open'} onClick={() => set('level', 'open')}>No prerequisite</button>
              <button type="button" className="tag" aria-pressed={level === 'intermediate'} onClick={() => set('level', 'intermediate')}>Intermediate</button>
            </div>
          </fieldset>
          <label className="switch">
            <input type="checkbox" checked={open} onChange={() => set('open', open ? '' : '1')} />
            <span>Hide fully booked</span>
          </label>
          {active.length > 0 && (
            <button type="button" className="linkbtn" onClick={() => setSp(new URLSearchParams(), { replace: true })}>Clear all filters</button>
          )}
          <div className="filters__aside">
            <p className="kicker">Private tutorials</p>
            <p>
              Email <a href="mailto:info@penumbrafoundation.org">info@penumbrafoundation.org</a> or call <a href="tel:+19172880343">917-288-0343</a>.
            </p>
            <L href="/policies" className="arrow">Education policies</L>
          </div>
        </aside>

        <section aria-live="polite" aria-label="Results">
          <p className="results-n mono">
            {list.length} of {items.length}
            {active.length ? ` · ${active.join(' · ')}` : ''}
          </p>
          {list.length ? (
            <div className="grid3">
              {list.map((w) => (
                <WorkshopCard key={w.slug} w={w} sizes="(min-width: 1100px) 26vw, (min-width: 700px) 45vw, 100vw" />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>No workshops match those filters this season.</p>
              <p>
                Ask about a private tutorial at <a href="mailto:info@penumbrafoundation.org">info@penumbrafoundation.org</a>, or{' '}
                <L href="/online-learning">browse online classes</L>.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
