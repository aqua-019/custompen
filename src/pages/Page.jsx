import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useData, useTitle, isLogo, strip } from '../lib/data'
import { sectionOf, NAV } from '../lib/nav'
import Blocks from '../components/Blocks'
import Img from '../components/Img'
import L from '../components/L'
import { Crumbs, Loading } from '../components/Cards'
import NotFound from './NotFound'

const TITLES = { 'book-session': 'Tintype Portrait Studio', 'upcoming-exhibitions': 'Now on view: North North South' }
const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function trimLeadingTitle(blocks, title) {
  if (!blocks.length || blocks[0].t !== 'text') return blocks
  const t = norm(title)
  const html = blocks[0].html.replace(/^\s*<h[1-3]>(.*?)<\/h[1-3]>/s, (m, inner) => {
    const n = norm(strip(inner))
    return n && (t.includes(n) || n.includes(t) || n.split(' ').every((w) => t.includes(w))) ? '' : m
  })
  const out = blocks.slice()
  if (strip(html)) out[0] = { ...blocks[0], html }
  else out.shift()
  return out
}

function usesImage(blocks, src) {
  const s = JSON.stringify(blocks)
  return src && s.includes(src)
}

const EXTRAS = {
  'book-session': (
    <dl className="rail rail--band">
      <div><dt>Format</dt><dd className="mono">8×10 tintype plates only</dd></div>
      <div><dt>Open</dt><dd className="mono">One weekend a month · Sat &amp; Sun 10am–7pm</dd></div>
      <div><dt>Where</dt><dd>Highlight Studios, top floor, 36 East 30th Street</dd></div>
      <div><dt>Pick-up</dt><dd className="mono">Within 30 days of your session</dd></div>
    </dl>
  ),
  visitus: (
    <dl className="rail rail--band">
      <div><dt>Address</dt><dd>36 East 30th Street, New York NY 10016</dd></div>
      <div><dt>Business hours</dt><dd className="mono">Mon–Fri · 10am–6pm</dd></div>
      <div><dt>Galleries</dt><dd className="mono">Mon–Fri · 2–6pm, by appointment</dd></div>
      <div><dt>Contact</dt><dd><a href="tel:+19172880343">917-288-0343</a> · <a href="mailto:info@penumbrafoundation.org">info@penumbrafoundation.org</a></dd></div>
    </dl>
  ),
}

export default function Page({ slugOverride }) {
  const loc = useLocation()
  const slug = slugOverride || decodeURIComponent(loc.pathname.replace(/^\//, '').replace(/\/$/, '')).replace('/', '__')
  const { data: p, error } = useData(`/data/pages/${slug}.json`)
  const title = TITLES[slug] || p?.title
  useTitle(title)

  const view = useMemo(() => {
    if (!p) return null
    const blocks = trimLeadingTitle(p.blocks, TITLES[slug] || p.title)
    const hero = p.img && !isLogo(p.img) && !usesImage(blocks, p.img) ? p.img : null
    const bodyText = blocks.filter((b) => b.t === 'text').map((b) => strip(b.html)).join(' ')
    const desc = p.desc && !norm(bodyText).includes(norm(p.desc).slice(0, 60)) ? p.desc : ''
    const firstPara = blocks[0]?.t === 'text' ? strip(blocks[0].html) : ''
    return { blocks, hero, desc, drop: firstPara.length > 260 }
  }, [p, slug])

  if (error) return <NotFound />
  if (!p) return <Loading />
  const section = sectionOf(loc.pathname)
  const grp = NAV.find((g) => g.label === section)
  const updated = p.updated ? new Date(p.updated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null

  return (
    <article className="shell page archive">
      <Crumbs trail={[{ label: section, href: grp?.items[0]?.href }, { label: title }]} />
      <header className="pg-hd">
        <p className="kicker">{section}</p>
        <h1 className="display display--md">{title}</h1>
        {view.desc && <p className="lede">{view.desc}</p>}
        {EXTRAS[slug]}
      </header>
      {view.hero && (
        <figure className="pg-hero">
          <Img src={view.hero} alt={p.title} ratio="16 / 9" eager sizes="(min-width: 1200px) 1100px, 100vw" />
        </figure>
      )}
      <div className={`pg-body ${view.drop ? 'has-drop' : ''}`}>
        <Blocks blocks={view.blocks} />
      </div>
      <footer className="pg-ft">
        {updated && <span className="mono">Updated {updated}</span>}
        <span className="mono">
          <a href={`https://www.penumbrafoundation.org/${slug.replace('__', '/')}`} target="_blank" rel="noopener">View on the current site ↗</a>
        </span>
      </footer>
      {grp && (
        <nav className="pg-more" aria-label={`More in ${section}`}>
          <p className="kicker">More in {section}</p>
          <ul>
            {grp.items.filter((i) => i.href !== loc.pathname).slice(0, 6).map((i) => (
              <li key={i.href}><L href={i.href} ext={i.ext}>{i.label}</L></li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  )
}
