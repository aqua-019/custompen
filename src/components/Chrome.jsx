import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from './L'
import Img from './Img'
import { Wordmark } from './Header'
import { useCart } from '../lib/cart'
import { LIVE, money, load, ADDRESS, PHONE, EMAIL, reducedMotion } from '../lib/data'
import { SUPPORTERS } from '../lib/nav'

export function ConceptBar() {
  const [hide, setHide] = useState(() => {
    try {
      return sessionStorage.getItem('custompen.bar') === '1'
    } catch {
      return false
    }
  })
  if (hide) return null
  return (
    <div className="concept" role="note">
      <div className="shell concept__in">
        <p>
          <strong>CUSTOMPEN</strong> — a redesign concept for penumbrafoundation.org. All content is from the live site. Bookings, payments and sign-ups
          finish on the official site.
        </p>
        <span className="concept__act">
          <a href={LIVE} target="_blank" rel="noopener">Live site ↗</a>
          <button
            onClick={() => {
              setHide(true)
              try {
                sessionStorage.setItem('custompen.bar', '1')
              } catch {}
            }}
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </span>
      </div>
    </div>
  )
}

export function CartDialog() {
  const cart = useCart()
  const [step, setStep] = useState('cart')
  return (
    <dialog ref={cart.dialogRef} className="sheet" aria-labelledby="cart-title" onClose={() => setStep('cart')}
      onClick={(e) => e.target === e.currentTarget && cart.close()}>
      <div className="sheet__in">
        <div className="sheet__hd">
          <h2 id="cart-title">{step === 'cart' ? 'Your cart' : 'Checkout'}</h2>
          <button className="btn btn--ghost btn--sm" onClick={cart.close}>Close</button>
        </div>
        {cart.items.length === 0 ? (
          <div className="sheet__empty">
            <p>Your cart is empty.</p>
            <div className="btnrow">
              <L href="/workshops" className="btn btn--ghost" onClick={cart.close}>Browse workshops</L>
              <L href="/penumbra-store" className="btn btn--ghost" onClick={cart.close}>Visit the shop</L>
            </div>
          </div>
        ) : step === 'cart' ? (
          <>
            <ul className="lines">
              {cart.items.map((it) => (
                <li key={it.key} className={`line ${cart.last === it.key ? 'is-new' : ''}`}>
                  <span className="line__img">{it.img ? <Img src={it.img} alt={it.title} ratio="1 / 1" sizes="72px" /> : <span className="img-plate" />}</span>
                  <span className="line__txt">
                    {it.path ? <L href={it.path} onClick={cart.close} className="line__title">{it.title}</L> : <span className="line__title">{it.title}</span>}
                    {it.sub && <span className="line__sub">{it.sub}</span>}
                    <span className="line__ctl">
                      <label className="sr" htmlFor={`q-${it.key}`}>Quantity</label>
                      <select id={`q-${it.key}`} value={it.qty} onChange={(e) => cart.setQty(it.key, +e.target.value)}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n}>{n}</option>)}
                      </select>
                      <button className="linkbtn" onClick={() => cart.remove(it.key)}>Remove</button>
                    </span>
                  </span>
                  <span className="price">{money(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="sheet__ft">
              <dl className="totals">
                <div><dt>Subtotal</dt><dd className="price">{money(cart.subtotal)}</dd></div>
                {cart.physical && <div><dt>Domestic shipping</dt><dd className="price">{money(10)}</dd></div>}
                <div className="totals__sum"><dt>Total</dt><dd className="price">{money(cart.subtotal + (cart.physical ? 10 : 0))}</dd></div>
              </dl>
              <p className="fine">Members: your tuition tier is already applied to each workshop line. All proceeds support Penumbra's programs.</p>
              <button className="btn btn--block" onClick={() => setStep('handoff')}>Continue to checkout</button>
            </div>
          </>
        ) : (
          <div className="handoff">
            <p>
              This is a redesign preview, so it can't take payment. Each item below opens its page on <strong>penumbrafoundation.org</strong>, where the same
              tier or variant completes through Penumbra's secure checkout.
            </p>
            <ol className="handoff__list">
              {cart.items.map((it) => (
                <li key={it.key}>
                  <span>
                    <strong>{it.title}</strong>
                    {it.sub && <> · {it.sub}</>} × {it.qty}
                  </span>
                  <a className="btn btn--sm" href={it.href} target="_blank" rel="noopener">Complete ↗</a>
                </li>
              ))}
            </ol>
            <div className="btnrow">
              <button className="btn btn--ghost" onClick={() => setStep('cart')}>Back to cart</button>
              <button className="linkbtn" onClick={() => { cart.clear(); cart.close() }}>Clear cart</button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  )
}

function score(q, it) {
  const t = it.t.toLowerCase()
  const x = (it.x || '').toLowerCase()
  let s = 0
  for (const w of q) {
    if (t.includes(w)) s += t.startsWith(w) ? 6 : 4
    else if (x.includes(w)) s += 1
    else return 0
  }
  if (it.k === 'Workshop') s += 1.5
  return s
}
export function useSearch(q) {
  const [idx, setIdx] = useState(null)
  useEffect(() => {
    if (q && !idx) load('/data/search.json').then(setIdx)
  }, [q, idx])
  return useMemo(() => {
    const words = (q || '').toLowerCase().split(/\s+/).filter((w) => w.length > 1)
    if (!idx || !words.length) return []
    return idx
      .map((it) => [score(words, it), it])
      .filter((x) => x[0] > 0)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 40)
      .map((x) => x[1])
  }, [q, idx])
}

export function SearchDialog({ dref }) {
  const [q, setQ] = useState('')
  const res = useSearch(q)
  const nav = useNavigate()
  const inputRef = useRef(null)
  const go = (u) => {
    dref.current?.close()
    if (/^https?:/.test(u)) window.open(u, '_blank', 'noopener')
    else nav(u, { viewTransition: !reducedMotion() })
  }
  return (
    <dialog ref={dref} className="search" aria-label="Search" onClose={() => setQ('')} onClick={(e) => e.target === e.currentTarget && dref.current.close()}>
      <form
        className="search__in"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`)
        }}
      >
        <label htmlFor="sq" className="kicker">Search Penumbra</label>
        <input id="sq" ref={inputRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Workshops, artists, exhibitions, books…" autoComplete="off" />
        <ul className="search__res" aria-live="polite">
          {res.slice(0, 8).map((r) => (
            <li key={r.u}>
              <button type="button" onClick={() => go(r.u)}>
                <span className="kicker">{r.k}</span>
                <span className="search__t">{r.t}</span>
              </button>
            </li>
          ))}
          {q && res.length > 8 && (
            <li>
              <button type="submit" className="search__all">See all {res.length} results →</button>
            </li>
          )}
          {q.length > 1 && res.length === 0 && <li className="fine">No matches yet. Try a technique (cyanotype, wet plate) or an artist's name.</li>}
        </ul>
      </form>
    </dialog>
  )
}

export function Footer() {
  return (
    <footer className="ftr">
      <div className="shell">
        <div className="ftr__grid">
          <div className="ftr__col ftr__brand">
            <Wordmark />
            <p className="ftr__mission">
              Brings together the Art and Science of Photography through education, exhibitions, research, outreach, public and residency programs.
            </p>
            <p className="ftr__etym">
              <em>Penumbra</em>, from Latin <em>paene</em> ‘almost’ + <em>umbra</em> ‘shadow’.
            </p>
          </div>
          <div className="ftr__col">
            <h2 className="kicker">Visit</h2>
            <address>
              {ADDRESS}
              <br />
              <a href="tel:+19172880343">{PHONE}</a>
              <br />
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </address>
            <dl className="hours">
              <div><dt>Business</dt><dd className="mono">Mon–Fri 10am–6pm</dd></div>
              <div><dt>Galleries</dt><dd className="mono">Mon–Fri 2–6pm, by appt.</dd></div>
              <div><dt>Weekends</dt><dd className="mono">10am–6pm, workshops &amp; tintype</dd></div>
            </dl>
          </div>
          <div className="ftr__col">
            <h2 className="kicker">Explore</h2>
            <ul className="ftr__links">
              <li><L href="/workshops">Workshops</L></li>
              <li><L href="/online-learning">Online learning</L></li>
              <li><L href="/book-session">Tintype studio</L></li>
              <li><L href="/upcoming-exhibitions">Exhibitions</L></li>
              <li><L href="/facility-rentals">Facility rentals</L></li>
              <li><L href="/penumbra-store">Shop</L></li>
              <li><L href="/membership-main">Membership</L></li>
              <li><L href="/donate">Donate</L></li>
            </ul>
          </div>
          <div className="ftr__col">
            <h2 className="kicker">Newsletter</h2>
            <form
              className="news"
              onSubmit={(e) => {
                e.preventDefault()
                window.open(`${LIVE}/subscribe`, '_blank', 'noopener')
              }}
            >
              <label htmlFor="news-email">Sign up with your email address to receive news and updates.</label>
              <div className="news__row">
                <input id="news-email" type="email" required placeholder="you@example.com" autoComplete="email" />
                <button className="btn">Sign up</button>
              </div>
              <p className="fine">Opens the sign-up form on penumbrafoundation.org.</p>
            </form>
            <ul className="social">
              <li><a href="https://www.instagram.com/penumbrafoundation/" target="_blank" rel="noopener">Instagram ↗</a></li>
              <li><a href="https://www.facebook.com/penumbrafoundation" target="_blank" rel="noopener">Facebook ↗</a></li>
            </ul>
          </div>
        </div>
        <div className="ftr__support">
          <p className="kicker">With major support from</p>
          <ul className="wall">
            {SUPPORTERS.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="fine">Penumbra Foundation's programs are made possible by our board of trustees, our members, and generous individuals and institutions in our community. Penumbra Foundation is a 501(c)(3) non-profit.</p>
        </div>
        <div className="ftr__base">
          <span className="mono">CUSTOMPEN · redesign concept · content © Penumbra Foundation</span>
          <span className="mono">
            <a href={LIVE} target="_blank" rel="noopener">penumbrafoundation.org ↗</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
