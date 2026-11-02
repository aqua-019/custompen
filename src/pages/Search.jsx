import { useSearchParams } from 'react-router-dom'
import { useTitle } from '../lib/data'
import { useSearch } from '../components/Chrome'
import Img from '../components/Img'
import L from '../components/L'
import { Crumbs } from '../components/Cards'

export default function Search() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const res = useSearch(q)
  useTitle(q ? `Search: ${q}` : 'Search')
  const groups = ['Workshop', 'Online class', 'Shop', 'Page'].map((k) => [k, res.filter((r) => r.k === k)]).filter(([, l]) => l.length)
  return (
    <div className="shell page">
      <Crumbs trail={[{ label: 'Search' }]} />
      <header className="idx-hd">
        <p className="kicker">Search</p>
        <h1 className="display display--md">{q ? <>Results for “{q}”</> : 'Search Penumbra'}</h1>
        <form role="search" className="nf__q" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="sq2" className="sr">Search</label>
          <input id="sq2" type="search" value={q} onChange={(e) => setSp(e.target.value ? { q: e.target.value } : {}, { replace: true })} placeholder="Workshops, artists, exhibitions, books…" autoFocus />
        </form>
        {q && <p className="results-n mono">{res.length} results across workshops, classes, the shop and {`${273}`} archive pages</p>}
      </header>
      {groups.map(([k, l]) => (
        <section key={k} className="sres">
          <h2 className="kicker">{k === 'Page' ? 'Pages & archive' : k + 's'} · {l.length}</h2>
          <ul>
            {l.map((r) => (
              <li key={r.u} className="sres__i">
                <span className="sres__img">{r.i ? <Img src={r.i} alt="" ratio="1 / 1" sizes="96px" /> : <span className="img-plate" />}</span>
                <span>
                  <L href={r.u} className="sres__t stretch">{r.t}</L>
                  <span className="sres__x">{r.x.slice(0, 180)}…</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
