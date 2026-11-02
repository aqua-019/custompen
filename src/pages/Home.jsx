import { useData, useTitle, money, strip, isLogo } from '../lib/data'
import { TIERS } from '../lib/tiers'
import Img from '../components/Img'
import Rich from '../components/Rich'
import L from '../components/L'
import { WorkshopCard, ProductCard } from '../components/Cards'

function splitTitle(t) {
  const parts = t.split('|').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 3) return { kicker: parts[0], title: parts[1], by: parts.slice(2).join(' · ') }
  if (parts.length === 2) return { kicker: parts[0], title: parts[1], by: '' }
  return { kicker: '', title: t, by: '' }
}

function frameText(html) {
  const paras = (html.match(/<p>[\s\S]*?<\/p>/g) || []).filter((p) => !/^<p>\s*<a/.test(p)).map(strip).filter((t) => t && !/^Image ©/.test(t))
  const sub = paras[0] && paras[0].length < 40 && paras.length > 1 ? paras[0] : ''
  const body = paras.find((t) => t !== sub && t.length > 30) || paras[0] || ''
  return { sub, body: body.replace(/Image ©.*$/, '').trim() }
}

/** The signature set-piece (one per surface): the homepage stories as a static 35 mm contact sheet. */
function ContactSheet({ slides }) {
  return (
    <section className="sheetstrip" aria-labelledby="cs-h">
      <div className="shell">
        <div className="sheetstrip__hd">
          <h2 id="cs-h" className="kicker">Contact sheet · this season at Penumbra</h2>
          <span className="mono sheetstrip__edge" aria-hidden="true">PENUMBRA 400 · 36 E 30 ST · NYC</span>
        </div>
      </div>
      <div className="film">
        <ol className="film__frames shell">
          {slides.map((s, i) => {
            const t = splitTitle(s.title)
            const href = s.links[0]?.href || '/'
            return (
              <li key={i} className="frame">
                <L href={href} className="frame__img" tabIndex={-1} aria-hidden="true">
                  <Img src={s.img} alt="" fp={s.fp} ratio="3 / 2" sizes="(min-width: 1100px) 16vw, 60vw" />
                </L>
                <span className="frame__no mono" aria-hidden="true">
                  {i + 2}
                  <span>{i + 2}A</span>
                </span>
                <h3 className="frame__t">
                  <L href={href}>{t.title}</L>
                </h3>
                {frameText(s.html).sub && <p className="frame__sub">{frameText(s.html).sub}</p>}
                <p className="frame__x">{frameText(s.html).body}</p>
                {s.links.length > 1 && (
                  <p className="frame__more">
                    {s.links.slice(1).map((a) => (
                      <L key={a.href} href={a.href}>{a.label}</L>
                    ))}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default function Home() {
  useTitle(null)
  const { data: home } = useData('/data/home.json')
  const { data: ws } = useData('/data/workshops.json')
  const { data: shop } = useData('/data/penumbra-store.json')
  if (!home) return <div className="hero hero--skeleton" aria-busy="true" />

  const [lead, ...rest] = home.slides
  const t = splitTitle(lead.title)
  const leadHtml = lead.html.replace(/<p>\s*<a[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>\s*<\/p>/g, '').replace(/<p>Penumbra Foundation is pleased to present[\s\S]*?<\/p>/, '')
  const intro = strip(lead.html).match(/Penumbra Foundation is pleased to present (.*?)\./)
  const upcoming = (ws?.items || []).filter((w) => !w.soldOut).slice(0, 4)
  const sizes = (ws?.items || []).map((w) => w.facts?.size).filter(Boolean)
  const proj = home.pages['project-gallery-current']
  const projParas = (rest[1]?.html.match(/<p>(.*?)<\/p>/g) || []).map(strip).filter(Boolean)
  const tint = rest[4]
  const products = (shop?.items || []).filter((p) => !p.soldOut && p.img && !isLogo(p.img) && !/shipping|LONG TERM/i.test(p.title)).slice(2, 6)

  return (
    <>
      <section className="hero" aria-labelledby="hero-t">
        <div className="hero__txt">
          <p className="kicker">Now on view · {t.kicker}</p>
          <h1 id="hero-t" className="display">{t.title}</h1>
          <p className="hero__by">{t.by}</p>
          {intro && <p className="hero__lede">The first New York City solo exhibition by visual artist {t.by}.</p>}
          <Rich className="hero__facts" html={leadHtml} />
          <div className="btnrow">
            <L href={lead.links[0]?.href || '/upcoming-exhibitions'} className="btn">About the exhibition</L>
            <L href="/visitus" className="btn btn--ghost">Plan your visit</L>
          </div>
        </div>
        <figure className="hero__fig">
          <Img src={lead.img} alt={`${t.title} by ${t.by}`} fp={lead.fp} ratio="auto" eager sizes="(min-width: 900px) 60vw, 100vw" />
          <figcaption className="mono">{t.title} · © {t.by}</figcaption>
        </figure>
      </section>

      <ContactSheet slides={rest} />

      <section className="mission shell" aria-label="Mission">
        <p className="mission__k kicker">About Penumbra · Mission</p>
        <p className="mission__t">
          Penumbra Foundation brings together the <em>Art</em> and <em>Science</em> of Photography — through education, exhibitions, research, outreach,
          public and residency programs.
        </p>
        <p className="mission__s">A resource for photographers at any level: artists, students, professionals, historians, researchers, conservators and curators.</p>
        <L href="/about" className="arrow">About Penumbra</L>
      </section>

      <section className="season shell" aria-labelledby="season-h">
        <header className="sec-hd">
          <div>
            <p className="kicker">Learn · Fall 2026</p>
            <h2 id="season-h" className="h2">This season’s workshops</h2>
          </div>
          <p className="sec-hd__lede">
            {ws && <><span className="count mono">{ws.items.length}</span> in-person workshops this season, classes of {Math.min(...sizes)}–{Math.max(...sizes)}. </>}
            We offer over 100 unique workshops each year; our faculty represents some of the most accomplished and innovative practitioners in their fields.
          </p>
        </header>
        <div className="grid4">
          {upcoming.map((w) => (
            <WorkshopCard key={w.slug} w={w} />
          ))}
        </div>
        <p className="btnrow">
          <L href="/workshops" className="btn">All workshops</L>
          <L href="/online-learning" className="btn btn--ghost">Online classes</L>
        </p>
      </section>

      <section className="onview" aria-labelledby="ov-h">
        <div className="shell">
          <header className="sec-hd">
            <div>
              <p className="kicker">Exhibitions</p>
              <h2 id="ov-h" className="h2">On view at 36 East 30th Street</h2>
            </div>
          </header>
          <div className="onview__grid">
            <article className="ovcard">
              <Img src={lead.img} alt={`${t.title} by ${t.by}`} fp={lead.fp} ratio="4 / 3" sizes="(min-width: 900px) 40vw, 100vw" />
              <div className="ovcard__body">
                <p className="kicker">Exhibition Space</p>
                <h3 className="h3"><L href="/upcoming-exhibitions" className="stretch">{t.title}</L></h3>
                <p>{t.by}</p>
                <dl className="rail">
                  <div><dt>When</dt><dd className="mono">Oct 23 – Nov 24, 2026</dd></div>
                  <div><dt>Hours</dt><dd className="mono">Mon–Fri · 2–6pm</dd></div>
                  <div><dt>Where</dt><dd>36 East 30th Street</dd></div>
                </dl>
              </div>
            </article>
            <article className="ovcard">
              <Img src={rest[1]?.img} alt="Penumbra Project Space reading room" fp={rest[1]?.fp} ratio="4 / 3" sizes="(min-width: 900px) 40vw, 100vw" />
              <div className="ovcard__body">
                <p className="kicker">Project Space</p>
                <h3 className="h3"><L href="/project-gallery-current" className="stretch">{projParas[0] || proj?.title}</L></h3>
                <p>{projParas[1]}</p>
                <dl className="rail">
                  <div><dt>Hours</dt><dd className="mono">Mon–Fri · 2–6pm</dd></div>
                  <div><dt>Where</dt><dd>36 East 30th Street</dd></div>
                </dl>
              </div>
            </article>
          </div>
        </div>
      </section>

      {tint && (
        <section className="tintband" aria-labelledby="tt-h">
          <div className="shell tintband__in">
            <figure className="tintband__plate">
              <Img src={tint.img} alt="A tintype portrait made in the Penumbra studio" fp={tint.fp} ratio="4 / 5" sizes="(min-width: 900px) 36vw, 100vw" />
            </figure>
            <div className="tintband__txt">
              <p className="kicker">Tintype Studio</p>
              <h2 id="tt-h" className="h2">The Polaroid of the 19th century</h2>
              <p className="lede">
                A tintype is made almost instantaneously, with hand-poured chemicals on an enameled sheet of metal. Our wet plate collodion portrait studio
                opens one weekend a month at Highlight Studios, our north-light studio. As of 2025 every plate is 8×10.
              </p>
              <dl className="rail">
                <div><dt>Format</dt><dd className="mono">8×10 plate · scan included</dd></div>
                <div><dt>Open</dt><dd className="mono">Select Sat &amp; Sun · 10am–7pm</dd></div>
                <div><dt>Scans</dt><dd className="mono">7 business days</dd></div>
              </dl>
              <p className="btnrow">
                <L href="/book-session" className="btn">Book a session</L>
                <L href="/tintype-faq" className="btn btn--ghost">FAQ &amp; policies</L>
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="ladder shell" aria-labelledby="mb-h">
        <header className="sec-hd">
          <div>
            <p className="kicker">Membership</p>
            <h2 id="mb-h" className="h2">Join our community</h2>
          </div>
          <p className="sec-hd__lede">Your membership has a direct impact and supports a vibrant community of emerging artists and photographers of all levels — with discounts on workshops, access to our facilities and member events.</p>
        </header>
        <ol className="ladder__rungs">
          {TIERS.map((t) => (
            <li key={t.id}>
              <L href="/membership-main" className="rung">
                <span className="rung__n">{t.name}</span>
                <span className="price">{money(t.price)}<small>/yr</small></span>
              </L>
            </li>
          ))}
        </ol>
        <p className="btnrow">
          <L href="/membership-main" className="btn">Compare memberships</L>
          <L href="/penumbra-store/membership" className="btn btn--ghost">Gift a membership</L>
        </p>
      </section>

      {products.length > 0 && (
        <section className="shopband shell" aria-labelledby="sh-h">
          <header className="sec-hd">
            <div>
              <p className="kicker">Shop</p>
              <h2 id="sh-h" className="h2">Bookstore &amp; editions</h2>
            </div>
            <p className="sec-hd__lede">All proceeds from the Online Store go toward supporting our programming.</p>
          </header>
          <div className="pgrid pgrid--4">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
          <p className="btnrow">
            <L href="/penumbra-store" className="btn btn--ghost">Visit the shop</L>
            <L href="/2026-gift-guide" className="btn btn--ghost">2026 Gift Guide</L>
          </p>
        </section>
      )}
    </>
  )
}
