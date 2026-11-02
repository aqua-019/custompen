import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useData, useTitle } from '../lib/data'
import Img from '../components/Img'
import L from '../components/L'

/** D6185 photo-headed institutional 404 · D0865 friendly 404: search + popular links, the chrome stays. */
export default function NotFound() {
  useTitle('Page not found')
  const { data: home } = useData('/data/home.json')
  const loc = useLocation()
  const [q, setQ] = useState(() => decodeURIComponent(loc.pathname.split('/').pop() || '').replace(/[-_]+/g, ' '))
  const nav = useNavigate()
  const s = home?.slides?.[4]
  return (
    <div className="nf">
      <figure className="nf__fig">
        <Img src={s?.img} fp={s?.fp} alt="Students building a camera obscura at Penumbra" ratio="21 / 8" eager sizes="100vw" />
      </figure>
      <div className="shell nf__in">
        <p className="kicker mono">404</p>
        <h1 className="display display--md">This page didn’t develop.</h1>
        <p className="lede">It may have moved, or the link was mistyped. Try a search, or start from one of these.</p>
        <form
          className="nf__q"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            nav(`/search?q=${encodeURIComponent(q)}`)
          }}
        >
          <label htmlFor="nfq" className="sr">Search the site</label>
          <input id="nfq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search workshops, exhibitions, artists" />
          <button className="btn">Search</button>
        </form>
        <ul className="nf__links">
          <li><L href="/workshops">Workshops</L></li>
          <li><L href="/book-session">Book a tintype session</L></li>
          <li><L href="/upcoming-exhibitions">Now on view</L></li>
          <li><L href="/membership-main">Membership</L></li>
          <li><L href="/penumbra-store">Shop</L></li>
          <li><L href="/visitus">Visit us</L></li>
        </ul>
      </div>
    </div>
  )
}
