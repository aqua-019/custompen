import { Link } from 'react-router-dom'
import { reducedMotion } from '../lib/data'

/** One link primitive: internal routes get a same-doc view transition (D0701), gated by D3453. */
export default function L({ href, to, children, className, ext, ...rest }) {
  const target = to || href || '#'
  if (ext || /^(https?:|mailto:|tel:)/.test(target)) {
    const external = /^https?:/.test(target)
    return (
      <a href={target} className={className} {...(external ? { target: '_blank', rel: 'noopener' } : {})} {...rest}>
        {children}
        {external && <span className="ext" aria-label=" (opens in a new tab)">↗</span>}
      </a>
    )
  }
  return (
    <Link to={target} className={className} viewTransition={!reducedMotion()} {...rest}>
      {children}
    </Link>
  )
}
