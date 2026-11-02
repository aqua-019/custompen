import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import L from './L'
import Img from './Img'
import { NAV, SHOP_LINKS, LOGO } from '../lib/nav'
import { useCart } from '../lib/cart'
import { useData } from '../lib/data'

function Icon({ name }) {
  const p = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    bag: <><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }[name]
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {p}
    </svg>
  )
}

export function Wordmark() {
  return (
    <L href="/" className="wordmark" aria-label="Penumbra Foundation — home">
      <img src={`${LOGO}?format=100w`} alt="" width="30" height="30" />
      <span>
        Penumbra <em>Foundation</em>
      </span>
    </L>
  )
}

export default function Header({ onSearch }) {
  const [open, setOpen] = useState(null)
  const [mobile, setMobile] = useState(false)
  const cart = useCart()
  const loc = useLocation()
  const ref = useRef(null)
  const { data: home } = useData('/data/home.json')
  const { data: ws } = useData('/data/workshops.json')

  useEffect(() => {
    setOpen(null)
    setMobile(false)
  }, [loc.pathname, loc.search])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && (setOpen(null), setMobile(false))
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('lock', mobile)
  }, [mobile])

  const featureImg = (g) => {
    const f = g.feature
    if (f.slide != null) return home?.slides?.[f.slide]
    if (f.slug === 'workshops') {
      const w = ws?.items?.find((x) => !x.soldOut) || ws?.items?.[0]
      return w && { img: w.img, fp: w.fp, title: w.name }
    }
    const p = home?.pages?.[f.slug]
    return p && { img: p.img, title: p.title }
  }

  const active = (g) => g.items.some((i) => loc.pathname === i.href)

  return (
    <header className="hdr" ref={ref}>
      <div className="hdr__bar shell">
        <Wordmark />
        <nav className="hdr__nav" aria-label="Primary">
          <ul>
            {NAV.map((g) => (
              <li key={g.label}>
                <button
                  className={`hdr__link ${active(g) ? 'is-current' : ''}`}
                  aria-expanded={open === g.label}
                  aria-controls={`mega-${g.label}`}
                  onClick={() => setOpen(open === g.label ? null : g.label)}
                >
                  {g.label}
                </button>
              </li>
            ))}
            <li>
              <L href="/penumbra-store" className={`hdr__link ${loc.pathname.startsWith('/penumbra-store') ? 'is-current' : ''}`}>Shop</L>
            </li>
          </ul>
        </nav>
        <div className="hdr__tools">
          <button className="iconbtn" onClick={onSearch} aria-label="Search the site (Ctrl K)">
            <Icon name="search" />
          </button>
          <L href="/donate" className="hdr__link hdr__donate">Donate</L>
          <button className="iconbtn cartbtn" onClick={cart.open} aria-label={`Cart, ${cart.count} item${cart.count === 1 ? '' : 's'}`}>
            <Icon name="bag" />
            {cart.count > 0 && <span className="cartbtn__n">{cart.count}</span>}
          </button>
          <L href="/membership-main" className="pill">Become a member</L>
          <button className="menuword" aria-expanded={mobile} aria-controls="mobile-menu" onClick={() => setMobile((m) => !m)}>
            {mobile ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {NAV.map((g) => {
        const f = featureImg(g)
        return (
          <div key={g.label} id={`mega-${g.label}`} className="mega" hidden={open !== g.label}>
            <div className="shell mega__in">
              <div className="mega__intro">
                <p className="kicker">{g.label}</p>
                <p className="mega__blurb">{g.blurb}</p>
              </div>
              <ul className="mega__list">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <L href={i.href} ext={i.ext} className={loc.pathname === i.href ? 'is-current' : ''}>{i.label}</L>
                  </li>
                ))}
              </ul>
              <L href={g.feature.href} className="mega__feature">
                <Img src={f?.img} fp={f?.fp} alt={f?.title || g.feature.label} ratio="4 / 3" sizes="320px" />
                <span className="kicker">{g.feature.label}</span>
                <span className="mega__ftitle">{f?.title?.replace(/\s*\|\s*/g, ' · ') || ''}</span>
              </L>
            </div>
          </div>
        )
      })}

      <div id="mobile-menu" className="mobile" hidden={!mobile}>
        <div className="shell">
          {NAV.map((g) => (
            <details key={g.label} className="mobile__grp">
              <summary>{g.label}</summary>
              <ul>
                {g.items.map((i) => (
                  <li key={i.href}>
                    <L href={i.href} ext={i.ext}>{i.label}</L>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <details className="mobile__grp">
            <summary>Shop</summary>
            <ul>
              {SHOP_LINKS.map((i) => (
                <li key={i.href}>
                  <L href={i.href}>{i.label}</L>
                </li>
              ))}
            </ul>
          </details>
          <div className="mobile__cta">
            <L href="/membership-main" className="btn">Become a member</L>
            <L href="/donate" className="btn btn--ghost">Donate</L>
          </div>
        </div>
      </div>
    </header>
  )
}
