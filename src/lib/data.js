import { useEffect, useState } from 'react'

const cache = new Map()
const inflight = new Map()

export function load(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url))
  if (inflight.has(url)) return inflight.get(url)
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw Object.assign(new Error('not found'), { status: r.status })
      const ct = r.headers.get('content-type') || ''
      if (!ct.includes('json')) throw Object.assign(new Error('not found'), { status: 404 })
      return r.json()
    })
    .then((d) => {
      cache.set(url, d)
      inflight.delete(url)
      return d
    })
    .catch((e) => {
      inflight.delete(url)
      throw e
    })
  inflight.set(url, p)
  return p
}

export function useData(url) {
  const [state, set] = useState(() => (url && cache.has(url) ? { data: cache.get(url), error: null } : { data: null, error: null }))
  useEffect(() => {
    if (!url) return
    let live = true
    if (cache.has(url)) {
      set({ data: cache.get(url), error: null })
      return
    }
    set({ data: null, error: null })
    load(url).then(
      (d) => live && set({ data: d, error: null }),
      (e) => live && set({ data: null, error: e }),
    )
    return () => {
      live = false
    }
  }, [url])
  return state
}

export const LIVE = 'https://www.penumbrafoundation.org'
export const ADDRESS = '36 East 30th Street, New York NY 10016'
export const PHONE = '917-288-0343'
export const EMAIL = 'info@penumbrafoundation.org'

export function useTitle(t) {
  useEffect(() => {
    document.title = t ? `${t} — Penumbra Foundation` : 'Penumbra Foundation — Photography Non-Profit in NYC'
  }, [t])
}

export const money = (n) =>
  n == null ? '' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })

export function strip(html = '') {
  const d = typeof document !== 'undefined' ? document.createElement('div') : null
  if (!d) return html.replace(/<[^>]+>/g, ' ')
  d.innerHTML = html.replace(/<\/(p|h\d|li|div)>/g, '</$1> ').replace(/<br\s*\/?>/g, ' ')
  return (d.textContent || '').replace(/\s+/g, ' ').trim()
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function monthOf(when = '') {
  const m = when.match(new RegExp(MONTHS.join('|')))
  return m ? m[0] : null
}
export function formatOf(w) {
  const when = w.when || ''
  const days = (w.facts && w.facts.days) || ''
  if (/\s[-–]\s/.test(when) || /days$/i.test(days.split(/\s/)[0] || '') && /,/.test(when)) return 'Weekly series'
  if (/&/.test(when)) return 'Two days'
  return 'One day'
}
export function isLogo(u = '') {
  return /PF_LOGO|PF_EYE_LOGO|Logos?%2B|All\+logos/i.test(u)
}
