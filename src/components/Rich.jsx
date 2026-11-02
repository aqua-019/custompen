import { useNavigate } from 'react-router-dom'
import { reducedMotion } from '../lib/data'

/** Rich text from the CMS. Internal links route client-side; external links open in a new tab. */
export default function Rich({ html, className = '', as: Tag = 'div' }) {
  const nav = useNavigate()
  const onClick = (e) => {
    const a = e.target.closest('a')
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const href = a.getAttribute('href') || ''
    if (href.startsWith('/') && !a.target) {
      e.preventDefault()
      nav(href, { viewTransition: !reducedMotion() })
    }
  }
  return <Tag className={`rich ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
