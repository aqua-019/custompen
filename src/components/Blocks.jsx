import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Img from './Img'
import Rich from './Rich'
import L from './L'
import { useCart } from '../lib/cart'
import { LIVE, money, ADDRESS } from '../lib/data'

export function Lightbox({ imgs, start, onClose }) {
  const [i, setI] = useState(start)
  const ref = useRef(null)
  const im = imgs[i]
  const go = (d) => setI((v) => (v + d + imgs.length) % imgs.length)
  return (
    <dialog
      ref={(el) => {
        ref.current = el
        if (el && !el.open) el.showModal()
      }}
      className="lightbox"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      aria-label="Image viewer"
    >
      <figure>
        <Img src={im.src} alt={im.alt} w={im.w} h={im.h} size={im.size} native fit="contain" sizes="90vw" eager />
        <figcaption>
          <span className="mono">
            {String(i + 1).padStart(2, '0')} / {String(imgs.length).padStart(2, '0')}
          </span>
          {im.cap && <span>{im.cap}</span>}
        </figcaption>
      </figure>
      <div className="lightbox__ctl">
        {imgs.length > 1 && (
          <>
            <button className="btn btn--ghost" onClick={() => go(-1)} aria-label="Previous image">←</button>
            <button className="btn btn--ghost" onClick={() => go(1)} aria-label="Next image">→</button>
          </>
        )}
        <button className="btn btn--ghost" onClick={() => ref.current?.close()} autoFocus>Close</button>
      </div>
    </dialog>
  )
}

function Gallery({ imgs }) {
  const [open, setOpen] = useState(null)
  const cls = imgs.length === 1 ? 'gallery gallery--one' : imgs.length <= 4 ? 'gallery gallery--few' : 'gallery'
  return (
    <div className={cls}>
      {imgs.map((im, i) => (
        <button key={im.src + i} className="gallery__item" onClick={() => setOpen(i)} aria-label={`View larger: ${im.alt}`}>
          <Img src={im.src} alt={im.alt} w={im.w} h={im.h} native sizes="(min-width: 900px) 30vw, 50vw" />
        </button>
      ))}
      {open != null && <Lightbox imgs={imgs} start={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Figure({ b, wide }) {
  const [open, setOpen] = useState(false)
  const logo = /logo/i.test(b.src) || /logo/i.test(b.alt)
  const img = <Img src={b.src} alt={b.alt} w={b.w} h={b.h} fp={b.fp} native sizes={wide ? '(min-width: 1100px) 880px, 100vw' : '(min-width: 900px) 50vw, 100vw'} />
  return (
    <figure className={`fig ${logo ? 'fig--logo' : ''}`}>
      {b.href ? (
        <L href={b.href} className="fig__link">{img}</L>
      ) : (
        <button className="fig__zoom" onClick={() => setOpen(true)} aria-label={`View larger: ${b.alt}`}>{img}</button>
      )}
      {b.cap && <Rich className="fig__cap" html={b.cap} as="figcaption" />}
      {open && <Lightbox imgs={[b]} start={0} onClose={() => setOpen(false)} />}
    </figure>
  )
}

function Video({ b }) {
  const [on, setOn] = useState(false)
  const id = (b.src.match(/embed\/([\w-]{6,})/) || [])[1]
  return (
    <div className="video">
      {on ? (
        <iframe src={b.src + (b.src.includes('?') ? '&' : '?') + 'autoplay=1'} title={b.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      ) : (
        <button className="video__poster" onClick={() => setOn(true)}>
          {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />}
          <span className="video__play">Play video<span className="mono"> · {b.title}</span></span>
        </button>
      )}
    </div>
  )
}

function MapBlock() {
  const [on, setOn] = useState(false)
  return (
    <div className="mapbox">
      {on ? (
        <iframe title="Map: Penumbra Foundation, 36 East 30th Street" loading="lazy" src="https://www.google.com/maps?q=36+E+30th+St,+New+York,+NY+10016&output=embed" />
      ) : (
        <div className="mapbox__gate">
          <p className="kicker">Map</p>
          <p className="mapbox__addr">{ADDRESS}</p>
          <div className="btnrow">
            <button className="btn btn--ghost" onClick={() => setOn(true)}>Load Google map</button>
            <a className="btn btn--ghost" href="https://maps.google.com/?q=36+E+30th+St,+New+York,+NY+10016" target="_blank" rel="noopener">Directions ↗</a>
          </div>
          <p className="fine">Loading the map shares your IP address with Google.</p>
        </div>
      )}
    </div>
  )
}

function ProductBlock({ b }) {
  const cart = useCart()
  const loc = useLocation()
  if (!b.title) return null
  return (
    <div className="pblock">
      <div>
        <p className="kicker">{b.soldOut ? 'Sold out' : 'Available'}</p>
        <h3 className="pblock__title">{b.title}</h3>
        {b.desc && <Rich className="pblock__desc" html={b.desc} />}
      </div>
      <div className="pblock__buy">
        <span className="price">{b.price ? money(Number(b.price)) : ''}</span>
        <button
          className="btn"
          disabled={b.soldOut}
          onClick={() =>
            cart.add({ key: 'pb-' + b.id, title: b.title, sub: '', price: Number(b.price || 0), img: b.img, href: LIVE + loc.pathname, path: loc.pathname })
          }
        >
          {b.soldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}

export function Block({ b, depth = 0 }) {
  switch (b.t) {
    case 'text':
      return <Rich className="prose" html={b.html} />
    case 'img':
      return <Figure b={b} wide={depth === 0} />
    case 'gallery':
      return <Gallery imgs={b.imgs} />
    case 'quote':
      return (
        <blockquote className="pull">
          <p>“{b.text}”</p>
          {b.cite && <cite>{b.cite}</cite>}
        </blockquote>
      )
    case 'btn':
      return (
        <p className="btnrow">
          <L href={b.href} className="btn btn--ghost">{b.label}</L>
        </p>
      )
    case 'hr':
      return <hr className="rule" />
    case 'video':
      return <Video b={b} />
    case 'acc':
      return (
        <div className="acc">
          {b.items.map((it, i) => (
            <details key={i}>
              <summary>{it.title}</summary>
              <Rich className="prose" html={it.html} />
            </details>
          ))}
        </div>
      )
    case 'acuity':
      return (
        <div className="embed embed--tall embed--acuity">
          <p className="embed__bar">
            <span className="kicker">Booking calendar · Acuity Scheduling</span>
            <a href={`https://app.acuityscheduling.com/schedule.php?owner=${b.owner}${b.calendar ? `&calendarID=${b.calendar}` : ''}`} target="_blank" rel="noopener">Open in a new tab ↗</a>
          </p>
          <iframe
            title="Book a session — Acuity Scheduling"
            src={`https://app.acuityscheduling.com/schedule.php?owner=${b.owner}${b.calendar ? `&calendarID=${b.calendar}` : ''}${b.type ? `&appointmentType=${b.type}` : ''}`}
            loading="lazy"
            allow="payment"
          />
        </div>
      )
    case 'embed':
      return (
        <div className={`embed ${/donorbox/.test(b.src) ? 'embed--tall' : ''}`}>
          <iframe title="Embedded content" src={b.src} loading="lazy" allow="payment" />
        </div>
      )
    case 'product':
      return <ProductBlock b={b} />
    case 'donate':
      return (
        <p className="btnrow">
          <L href="/donate" className="btn">Make a donation</L>
        </p>
      )
    case 'form':
      return (
        <div className="formnote">
          <p>This form submits on the live site.</p>
          <a className="btn btn--ghost" href={LIVE + window.location.pathname} target="_blank" rel="noopener">Open the form on penumbrafoundation.org ↗</a>
        </div>
      )
    case 'map':
      return <MapBlock />
    case 'row':
      return (
        <div className="row">
          {b.cols.map((c, i) => (
            <div key={i} className="row__col" style={{ '--span': c.span }}>
              {c.blocks.map((x, j) => (
                <Block key={j} b={x} depth={depth + 1} />
              ))}
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

export default function Blocks({ blocks }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </div>
  )
}
