import { useState } from 'react'

const WIDTHS = [300, 500, 750, 1000, 1500, 2500]
const isSqs = (u) => /squarespace-cdn\.com/.test(u || '')

/**
 * D2212 focal-point cropping · D6179 ink-tint ratio placeholder · D0893 image fallback chain
 * (srcset → original → branded plate). `ratio` locks the box (venue photography);
 * `native` keeps the artwork's own proportions (D5295).
 */
export default function Img({ src, alt, fp, ratio, native, w, h, size, sizes = '100vw', className = '', eager, style, fit = 'cover', plate }) {
  const [stage, setStage] = useState(0)
  const [loaded, setLoaded] = useState(false)
  let dims = null
  if (size && /^\d+x\d+$/.test(size)) dims = size.split('x').map(Number)
  else if (w && h) dims = [w, h]
  const box = native && dims && src ? `${dims[0]} / ${dims[1]}` : ratio || (dims && src ? `${dims[0]} / ${dims[1]}` : '4 / 5')
  const [x, y] = String(fp || '0.5,0.5').split(',').map((n) => Math.round(Number(n) * 100))
  const label = alt && alt.trim() ? alt : 'Photograph, Penumbra Foundation'

  let body
  if (!src || stage >= 2) {
    body = (
      <span className={`img-plate ${plate ? 'img-plate--t' : ''}`} role="img" aria-label={label}>
        <span aria-hidden="true">{plate || 'P'}</span>
      </span>
    )
  } else {
    const sqs = isSqs(src) && stage === 0
    body = (
      <img
        src={sqs ? `${src}?format=1000w` : src}
        srcSet={sqs ? WIDTHS.map((n) => `${src}?format=${n}w ${n}w`).join(', ') : undefined}
        sizes={sqs ? sizes : undefined}
        alt={label}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setStage((s) => s + 1)}
        style={{ objectFit: fit, objectPosition: `${x}% ${y}%` }}
        className={loaded ? 'is-loaded' : ''}
      />
    )
  }
  return (
    <span className={`img ${native ? 'img--native' : ''} ${className}`} style={{ aspectRatio: box, ...style }}>
      {body}
    </span>
  )
}
