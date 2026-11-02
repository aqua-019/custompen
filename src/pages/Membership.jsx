import { useTitle, money, LIVE } from '../lib/data'
import { TIERS, MATRIX } from '../lib/tiers'
import { useCart } from '../lib/cart'
import L from '../components/L'
import Img from '../components/Img'
import { Crumbs } from '../components/Cards'

const BANNER = 'https://images.squarespace-cdn.com/content/v1/55d61c1be4b0cafd401171f5/7fca5018-35f0-4bb6-8f00-77c2972d6ead/20250919_V_LUTTER_STUDIO_VISIT-02.jpg'

export default function Membership() {
  useTitle('Membership')
  const cart = useCart()
  const join = (t) =>
    cart.add({ key: `membership-${t.id}`, title: `${t.name} Membership`, sub: 'One year', price: t.price, img: null, href: LIVE + t.href, path: t.href })

  return (
    <div className="page">
      <div className="shell">
        <Crumbs trail={[{ label: 'Membership' }]} />
        <header className="mhero">
          <div>
            <p className="kicker">Membership &amp; support</p>
            <h1 className="display display--md">Join our community</h1>
            <p className="lede">
              Your membership has a direct impact and supports a vibrant community of emerging artists and photographers of all levels. With your gift, we
              can continue offering year-round education, artists’ lectures, and photography exhibitions.
            </p>
          </div>
          <figure className="mhero__fig">
            <Img src={BANNER} alt="Penumbra members on a studio visit" ratio="4 / 3" eager sizes="(min-width: 900px) 40vw, 100vw" />
            <figcaption className="mono">Member event · studio visit</figcaption>
          </figure>
        </header>

        <ol className="tiers-grid">
          {TIERS.map((t) => (
            <li key={t.id} className="tcard">
              <p className="kicker">{t.price >= 350 ? 'Premium' : 'Annual'}</p>
              <h2 className="tcard__n">{t.name}</h2>
              <p className="tcard__p price">
                {money(t.price)}
                <small>/year</small>
              </p>
              <p className="tcard__l">{t.line}</p>
              {t.note && <p className="fine">{t.note}</p>}
              <div className="tcard__ctl">
                <button className="btn btn--ghost btn--block" onClick={() => join(t)}>Join · {money(t.price)}</button>
                <L href={t.href} className="arrow">Full benefits</L>
              </div>
            </li>
          ))}
        </ol>

        <section className="compare" aria-labelledby="cmp-h">
          <h2 id="cmp-h" className="h2">Compare every tier</h2>
          <p className="fine">Discounts apply to workshops, online classes, tintype sessions, Highlight Studios and LTI Lightside film processing.</p>
          <div className="compare__scroll" tabIndex={0} role="region" aria-label="Membership comparison table, scrolls sideways">
            <table>
              <thead>
                <tr>
                  <th scope="col"><span className="sr">Benefit</span></th>
                  {TIERS.map((t) => (
                    <th scope="col" key={t.id}>
                      {t.name}
                      <span className="price">{money(t.price)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map(([label, ...cells]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {cells.map((c, i) => (
                      <td key={i} className={c === '●' ? 'yes' : ''}>
                        {c === '●' ? <span aria-label="Included">●</span> : c ? <span className="mono">{c}</span> : <span aria-label="Not included" className="no">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mfoot">
          <div>
            <h2 className="h3">Gift a membership</h2>
            <p>Give a year of Penumbra to a friend or loved one.</p>
            <L href="/penumbra-store/membership" className="btn btn--ghost">Gift a membership</L>
          </div>
          <div>
            <h2 className="h3">WOPHA members</h2>
            <p>Members of the Women Photographers International Archive receive a discounted Individual Membership.</p>
            <L href="/wopha-penumbra-membership" className="arrow">WOPHA × Penumbra</L>
          </div>
          <div>
            <h2 className="h3">Tax-deductible</h2>
            <p className="fine">
              Penumbra Foundation is a tax-exempt charitable organization under Section 501(c)(3) of the Internal Revenue Code. Memberships are
              non-refundable and tax-deductible to the extent allowed by law.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
