import { useCart, useUI } from "../lib/store";
import { money } from "../lib/format";
import A from "./A";
import Img from "./Img";
import { CloseIcon } from "./Icons";

export function CartLines({ compact }) {
  const { lines, setQty, remove } = useCart();
  if (!lines.length) return <p className="muted">Your cart is empty. Workshops, books and editions you add will wait here.</p>;
  return (
    <div>
      {lines.map((l) => (
        <div className="cartline" key={l.key}>
          <Img img={l.img} ratio="1 / 1" fit="contain" sizes="72px" width={300} />
          <div>
            <A to={l.slug} className="t">{l.title}</A>
            {l.variant && l.variant !== "Standard" && <div className="v">{l.variant}</div>}
            <div className="actions-row">
              <div className="qty" role="group" aria-label={`Quantity for ${l.title}`}>
                <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease">−</button>
                <output aria-live="polite">{l.qty}</output>
                <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label="Increase">+</button>
              </div>
              <button type="button" className="linkbtn" onClick={() => remove(l.key)}>Remove</button>
            </div>
          </div>
          <div className="p">{money((l.price || 0) * l.qty)}</div>
        </div>
      ))}
      {!compact && null}
    </div>
  );
}

export default function CartDrawer() {
  const { cartRef, closeCart } = useUI();
  const { count, subtotal } = useCart();
  return (
    <dialog ref={cartRef} className="drawer" aria-labelledby="cart-title"
      onClick={(e) => { if (e.target === e.currentTarget) closeCart(); }}>
      <div className="drawer-head">
        <h2 id="cart-title" className="title-3">Cart <span className="muted">({count})</span></h2>
        <button className="iconbtn" onClick={closeCart} aria-label="Close cart"><CloseIcon /></button>
      </div>
      <div className="drawer-body"><CartLines /></div>
      <div className="drawer-foot">
        <div className="totals"><div className="row grand"><span>Subtotal</span><span>{money(subtotal)}</span></div></div>
        <A to="/cart" className="btn btn--block" onClick={closeCart} aria-disabled={!count}>Review &amp; check out</A>
        <button className="btn btn--ghost btn--block" onClick={closeCart}>Keep browsing</button>
      </div>
    </dialog>
  );
}
