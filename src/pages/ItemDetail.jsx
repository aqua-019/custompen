import { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useData, useTitle, money, LIVE, strip } from '../lib/data'
import { useCart } from '../lib/cart'
import Img from '../components/Img'
import Blocks, { Lightbox } from '../components/Blocks'
import L from '../components/L'
import { Crumbs, Chip, WorkshopCard, ProductCard, Loading } from '../components/Cards'
import NotFound from './NotFound'

const TIER_ORDER = { public: 0, member: 1, new: 2, pro: 3 }
const TIER_NOTE = {
  public: 'Standard tuition',
  member: 'Individual, Student, Educator or Dual members',
  new: 'Tuition plus a new one-year Individual membership',
  pro: 'Professional and Patron members',
}

function Gallery({ imgs, title }) {
  const [open, setOpen] = useState(null)
  if (!imgs?.length) return <Img src={null} alt={title} ratio="4 / 3" />
  const [first, ...more] = imgs
  return (
    <div className="dgal">
      <button className="dgal__main" onClick={() => setOpen(0)} aria-label={`View larger: ${first.alt}`}>
        <Img src={first.src} alt={first.alt} fp={first.fp} size={first.size} native eager sizes="(min-width: 1000px) 58vw, 100vw" />
      </button>
      {more.length > 0 && (
        <div className="dgal__thumbs">
          {more.slice(0, 8).map((im, i) => (
            <button key={im.src} onClick={() => setOpen(i + 1)} aria-label={`View larger: ${im.alt}`}>
              <Img src={im.src} alt={im.alt} fp={im.fp} ratio="1 / 1" sizes="160px" />
            </button>
          ))}
        </div>
      )}
      {open != null && <Lightbox imgs={imgs.map((i) => ({ ...i, cap: '' }))} start={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

/** Workshop + online class detail — D3471 sticky-column configurator · D5729 visit rail */
export function WorkshopDetail({ col = 'workshops' }) {
  const { slug } = useParams()
  const { data: it, error } = useData(`/data/items/${col}__${slug}.json`)
  const { data: all } = useData(`/data/${col}.json`)
  const cart = useCart()
  const [tier, setTier] = useState(null)
  useTitle(it?.name || it?.title)

  const variants = useMemo(() => (it?.variants || []).slice().sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)), [it])
  useEffect(() => {
    if (variants.length) setTier((variants.find((v) => v.inStock) || variants[0]).id)
  }, [variants])

  if (error) return <NotFound />
  if (!it) return <Loading label="Loading workshop" />
  const sel = variants.find((v) => v.id === tier)
  const idx = all?.items?.findIndex((x) => x.slug === it.slug) ?? -1
  const prev = idx > 0 ? all.items[idx - 1] : null
  const next = all && idx >= 0 && idx < all.items.length - 1 ? all.items[idx + 1] : null
  const related = (all?.items || []).filter((x) => x.slug !== it.slug && x.cats.some((c) => it.cats.includes(c) && c !== 'Intermediate')).slice(0, 3)
  const online = col === 'online-courses'
  const live = LIVE + it.path
  const ld = {
    '@context': 'https://schema.org',
    '@type': online ? 'Course' : 'Event',
    name: it.name || it.title,
    description: it.excerpt || strip(it.blocks?.[0]?.html || '').slice(0, 300),
    image: it.img,
    ...(online
      ? { provider: { '@type': 'Organization', name: 'Penumbra Foundation' } }
      : {
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: { '@type': 'Place', name: 'Penumbra Foundation', address: '36 East 30th Street, New York, NY 10016' },
          organizer: { '@type': 'Organization', name: 'Penumbra Foundation', url: LIVE },
          performer: it.instructor ? { '@type': 'Person', name: it.instructor } : undefined,
          offers: variants.map((v) => ({ '@type': 'Offer', name: v.tierLabel, price: v.price, priceCurrency: 'USD', availability: v.inStock ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: live })),
        }),
  }

  return (
    <div className="shell page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Crumbs trail={[{ label: 'Learn', href: '/workshops' }, { label: online ? 'Online classes' : 'Workshops', href: online ? '/online-learning' : '/workshops' }, { label: it.name || it.title }]} />
      <div className="detail">
        <div className="detail__main">
          <Gallery imgs={it.imgs} title={it.title} />
          <div className="detail__body">
            <Blocks blocks={it.blocks} />
          </div>
        </div>
        <aside className="detail__side">
          <div className="sticky">
            <p className="kicker">{it.cats.filter((c) => c !== 'Intermediate').slice(0, 3).join(' · ') || (online ? 'Online class' : 'Workshop')}</p>
            <h1 className="h1">{it.name || it.title}</h1>
            {it.instructor && <p className="detail__by">with {it.instructor}</p>}
            <dl className="rail rail--detail">
              {it.when && <div><dt>When</dt><dd className="mono">{it.facts?.days ? `${it.facts.days} · ` : ''}{it.when}</dd></div>}
              {it.facts?.time && <div><dt>Time</dt><dd className="mono">{it.facts.time}</dd></div>}
              <div><dt>Where</dt><dd>{online ? 'Online' : '36 East 30th Street, NYC'}</dd></div>
              {it.facts?.size && <div><dt>Class size</dt><dd className="mono">{it.facts.size} max</dd></div>}
              {it.level && <div><dt>Level</dt><dd>{it.level}</dd></div>}
              {it.facts?.materials && <div><dt>Materials</dt><dd className="mono">{money(it.facts.materials)} fee included</dd></div>}
              {it.facts?.prereq && <div><dt>Prerequisite</dt><dd>{it.facts.prereq}</dd></div>}
            </dl>

            <fieldset className="tiers">
              <legend className="kicker">Tuition</legend>
              {variants.map((v) => (
                <label key={v.id} className={`tier ${v.inStock ? '' : 'is-out'}`}>
                  <input type="radio" name="tier" value={v.id} checked={tier === v.id} onChange={() => setTier(v.id)} />
                  <span className="tier__txt">
                    <span className="tier__n">{v.tierLabel === 'Standard' ? v.label : v.tierLabel}</span>
                    <span className="tier__note">{TIER_NOTE[v.tier] || v.label}</span>
                  </span>
                  <span className="tier__p">
                    <span className="price">{money(v.price)}</span>
                    <Chip tone={v.inStock ? '' : 'chip--mute'}>{v.inStock ? 'Open' : 'Full'}</Chip>
                  </span>
                </label>
              ))}
            </fieldset>

            {sel && sel.inStock ? (
              <button
                className="btn btn--block"
                onClick={() =>
                  cart.add({ key: `${it.path}#${sel.id}`, title: it.name || it.title, sub: `${sel.tierLabel}${it.when ? ' · ' + it.when : ''}`, price: sel.price, img: it.img, href: live, path: it.path })
                }
              >
                Register · {money(sel.price)}
              </button>
            ) : (
              <a
                className="btn btn--block btn--ghost"
                href={`mailto:info@penumbrafoundation.org?subject=${encodeURIComponent(`Waitlist: ${it.title}`)}&body=${encodeURIComponent(`Hello,\n\nPlease add me to the waitlist for ${it.title}${sel ? ` (${sel.tierLabel})` : ''}.\n\nName:\nPhone:\n`)}`}
              >
                {it.soldOut ? 'Class full — join the waitlist' : 'This tier is full — email to be accommodated'}
              </a>
            )}
            <p className="fine">
              Members save up to 20%. <L href="/membership-main">Compare memberships</L> · <L href="/policies">Education policies</L>
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="more">
          <h2 className="h3">More in {related[0].cats.find((c) => it.cats.includes(c))}</h2>
          <div className="grid3">
            {related.map((w) => <WorkshopCard key={w.slug} w={w} />)}
          </div>
        </section>
      )}
      <nav className="pager" aria-label="More workshops">
        {prev ? <L href={prev.path} className="pager__a"><span className="kicker">Previous</span>{prev.name}</L> : <span />}
        <L href={online ? '/online-learning' : '/workshops'} className="pager__all">All {online ? 'online classes' : 'workshops'}</L>
        {next ? <L href={next.path} className="pager__a pager__a--next"><span className="kicker">Next</span>{next.name}</L> : <span />}
      </nav>
    </div>
  )
}

/** Shop product — TP04 calm commerce: no urgency copy, sold-out offers a note-to-staff instead of a dead button. */
export function ProductDetail() {
  const loc = useLocation()
  const path = loc.pathname.replace(/^\//, '').replace(/\/$/, '')
  const col = path.split('/')[0]
  const { data: it, error } = useData(`/data/items/${path.replace('/', '__')}.json`)
  const { data: all } = useData(col === 'penumbra-store' ? '/data/penumbra-store.json' : null)
  const cart = useCart()
  const [vid, setVid] = useState(null)
  useTitle(it?.title)
  useEffect(() => {
    if (it?.variants?.length) setVid((it.variants.find((v) => v.inStock) || it.variants[0]).id)
  }, [it])

  if (error) return <NotFound />
  if (!it) return <Loading label="Loading" />
  const sel = it.variants.find((v) => v.id === vid)
  const multi = it.variants.length > 1
  const physical = /book|print|photobook|monograph|publication|risograph|tote|tee|edition|portfolio/i.test(it.cats.join(' ') + ' ' + it.title) && !/gift|certificate|membership|program/i.test(it.title)
  const related = (all?.items || []).filter((x) => x.slug !== it.slug && !x.soldOut && x.cats.some((c) => it.cats.includes(c)) && !/shipping/i.test(x.title)).slice(0, 4)
  const price = sel ? sel.sale || sel.price : it.from
  const base = it.title.replace(/\s*x\d+\s*$/i, '').replace(/\s+/g, ' ').trim()
  const plans = base !== it.title.replace(/\s+/g, ' ').trim() ? (all?.items || []).filter((x) => x.title.replace(/\s*x\d+\s*$/i, '').replace(/\s+/g, ' ').trim() === base) : []

  return (
    <div className="shell page">
      <Crumbs trail={[{ label: 'Shop', href: '/penumbra-store' }, { label: it.cats[0] || 'Item', href: it.cats[0] ? `/penumbra-store?category=${encodeURIComponent(it.cats[0])}` : '/penumbra-store' }, { label: it.title }]} />
      <div className="detail">
        <div className="detail__main">
          <Gallery imgs={it.imgs} title={it.title} />
          <div className="detail__body">
            <Blocks blocks={it.blocks} />
          </div>
        </div>
        <aside className="detail__side">
          <div className="sticky">
            <p className="kicker">{it.cats.slice(0, 2).join(' · ') || 'Penumbra shop'}</p>
            <h1 className="h1">{it.title}</h1>
            <p className="detail__price price">
              {sel?.sale ? <><s>{money(sel.price)}</s> {money(sel.sale)}</> : money(price)}
              {it.subscription && <span className="fine"> · billed in instalments over one year</span>}
            </p>
            {plans.length > 1 && (
              <nav className="tiers" aria-label="Payment plans">
                <p className="kicker">Payment plan</p>
                {plans.map((x) => (
                  <L key={x.slug} href={x.path} className={`tier tier--link ${x.slug === it.slug ? 'is-sel' : ''}`} aria-current={x.slug === it.slug ? 'page' : undefined}>
                    <span className="tier__txt"><span className="tier__n">{(x.title.match(/x(\d+)\s*$/i) || [])[1] === '1' ? 'Pay in full' : `${(x.title.match(/x(\d+)\s*$/i) || [])[1]} payments`}</span></span>
                    <span className="tier__p"><span className="price">{money(x.from)}</span></span>
                  </L>
                ))}
              </nav>
            )}
            {multi && (
              <fieldset className="tiers">
                <legend className="kicker">Options</legend>
                {it.variants.map((v) => (
                  <label key={v.id} className={`tier ${v.inStock ? '' : 'is-out'}`}>
                    <input type="radio" name="variant" value={v.id} checked={vid === v.id} onChange={() => setVid(v.id)} />
                    <span className="tier__txt"><span className="tier__n">{v.label}</span></span>
                    <span className="tier__p">
                      <span className="price">{money(v.sale || v.price)}</span>
                      {!v.inStock && <Chip tone="chip--mute">Sold out</Chip>}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {sel && sel.inStock ? (
              <button
                className="btn btn--block"
                onClick={() => cart.add({ key: `${it.path}#${sel.id}`, title: it.title, sub: multi ? sel.label : '', price, img: it.img, href: LIVE + it.path, path: it.path, physical })}
              >
                Add to cart · {money(price)}
              </button>
            ) : (
              <a className="btn btn--block btn--ghost" href={`mailto:info@penumbrafoundation.org?subject=${encodeURIComponent(`Availability: ${it.title}`)}`}>
                Sold out — ask about availability
              </a>
            )}
            <p className="fine">All proceeds from the shop go toward supporting Penumbra's programming.{physical ? ' Domestic shipping $10.' : ''}</p>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="more">
          <h2 className="h3">You might also like</h2>
          <div className="pgrid pgrid--4">
            {related.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
