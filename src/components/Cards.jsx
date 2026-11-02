import L from './L'
import Img from './Img'
import { money, monthOf } from '../lib/data'

export function Chip({ children, tone = '' }) {
  return <span className={`chip ${tone}`}>{children}</span>
}

export function availability(w) {
  if (w.soldOut) return { label: 'Waitlist', tone: 'chip--mute' }
  return { label: 'Open', tone: '' }
}

/** D5734 date-and-category rule line · D5302 dot-flanked status chip · D3465-style stretched link */
export function WorkshopCard({ w, sizes = '(min-width: 1100px) 25vw, (min-width: 700px) 45vw, 100vw' }) {
  const a = availability(w)
  const tech = w.cats.filter((c) => c !== 'Intermediate')[0] || 'Workshop'
  return (
    <article className={`wcard ${w.soldOut ? 'is-soldout' : ''}`}>
      <Img src={w.img} alt={w.imgs?.[0]?.alt || w.name} fp={w.fp} ratio="4 / 3" sizes={sizes} />
      <p className="ruleline">
        <span className="mono">{w.when || monthOf(w.title)}</span>
        <span>{tech}</span>
      </p>
      <h3 className="wcard__t">
        <L href={w.path} className="stretch">{w.name}</L>
      </h3>
      {w.instructor && <p className="wcard__by">with {w.instructor}</p>}
      <p className="wcard__meta">
        <Chip tone={a.tone}>{a.label}</Chip>
        <span className="mono">
          {w.facts?.size ? `${w.facts.size} max · ` : ''}from {money(w.from)}
        </span>
      </p>
    </article>
  )
}

export function ProductCard({ p, sizes = '(min-width: 1100px) 22vw, (min-width: 700px) 30vw, 50vw' }) {
  const sale = p.variants.find((v) => v.sale)
  const multi = p.from !== p.to
  return (
    <article className={`pcard ${p.soldOut ? 'is-soldout' : ''}`}>
      <Img src={p.img} alt={p.imgs?.[0]?.alt || p.title} size={p.imgs?.[0]?.size} native sizes={sizes} plate={p.title} />
      <h3 className="pcard__t">
        <L href={p.path} className="stretch">{p.title}</L>
      </h3>
      <p className="pcard__meta">
        <span className="price">
          {multi || p.plans > 1 ? 'from ' : ''}
          {sale ? (
            <>
              <s>{money(sale.price)}</s> {money(sale.sale)}
            </>
          ) : (
            money(p.from)
          )}
          {p.plans > 1 ? ` · ${p.plans} payment plans` : p.subscription ? ' · instalments' : ''}
        </span>
        {p.soldOut && <Chip tone="chip--mute">Sold out</Chip>}
      </p>
    </article>
  )
}

export function Crumbs({ trail }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((t, i) => (
          <li key={i}>{t.href && i < trail.length - 1 ? <L href={t.href}>{t.label}</L> : <span aria-current={i === trail.length - 1 ? 'page' : undefined}>{t.label}</span>}</li>
        ))}
      </ol>
    </nav>
  )
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="shell loading" role="status" aria-live="polite">
      <span className="kicker">{label}…</span>
    </div>
  )
}
