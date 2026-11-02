import A from "./A";
import Img from "./Img";
import { money, shortDate } from "../lib/format";
import { memberPrice, publicPrice } from "../lib/catalog";

export function WorkshopTile({ w, eager }) {
  const mp = memberPrice(w);
  const pp = publicPrice(w);
  return (
    <article className="tile">
      <div style={{ position: "relative" }}>
        <Img img={w.images[0]} className="tile-media" ratio="4 / 3" sizes="(min-width: 1200px) 22vw, (min-width: 700px) 45vw, 100vw" width={750} eager={eager} />
        <div className="badges">{w.soldOut && <span className="badge badge--sold">Sold out · waitlist</span>}</div>
      </div>
      <div className="meta"><b>{w.when || shortDate(w.start)}</b><span>{w.facts?.time || ""}</span></div>
      <h3><A to={w.slug} className="stretch">{w.short}</A></h3>
      {w.instructor && <p className="by">with {w.instructor}</p>}
      <div className="meta" style={{ borderTop: 0, paddingTop: 0 }}>
        <span>{pp ? <>Tuition <b>{money(pp)}</b></> : null}</span>
        <span>{mp ? <>Members from <b>{money(mp)}</b></> : null}</span>
      </div>
    </article>
  );
}

export function ProductTile({ p }) {
  return (
    <article className="tile">
      <div style={{ position: "relative" }}>
        <Img img={p.images[0]} className="tile-plate" ratio="1 / 1" fit="contain" sizes="(min-width: 1200px) 18vw, (min-width: 700px) 30vw, 50vw" width={750} />
        <div className="badges">{p.soldOut && <span className="badge badge--sold">Sold out</span>}</div>
      </div>
      <h3><A to={p.slug} className="stretch">{p.title}</A></h3>
      <div className="meta">
        <span>{p.shelf}</span>
        <b>{p.payments ? `from ${money(Math.min(...p.payments.map((x) => x.price)))}` : (p.variants?.length > 1 && p.from !== p.to ? `from ${money(p.from)}` : money(p.from))}</b>
      </div>
    </article>
  );
}
