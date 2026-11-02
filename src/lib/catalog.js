import shopData from "../data/shop.json";
import workshopsData from "../data/workshops.json";
import onlineData from "../data/online.json";

/* Shop: sixteen overlapping Squarespace categories become five shelves a visitor understands. */
export function shelfOf(p) {
  const t = p.title.toLowerCase();
  if (/long term program/.test(t)) return "Programs";
  if (/gift|membership/.test(p.slug) || p.categories.includes("Gift Certificate")) return "Gifts";
  if (/tote|shirt|tee\b/.test(t)) return "Merchandise";
  if ((p.from ?? 0) >= 200 || /photogravure|portfolio|limited edition|clich|prints|special edition/.test(t)) return "Prints & Editions";
  return "Books";
}
export const SHELVES = ["Books", "Prints & Editions", "Gifts", "Programs", "Merchandise"];
const HIDDEN = new Set(["/penumbra-store/domestic-shipping"]);

// the eight Long Term Program installment SKUs collapse into one listing per cohort year
export function programFamily(p) {
  const m = p.title.match(/LONG TERM PROGRAM: THE PHOTOBOOK \((\d{4})\)\s*x\s*(\d+)/i);
  return m ? { year: m[1], payments: Number(m[2]) } : null;
}

export function shopListing() {
  const seen = new Map();
  const out = [];
  for (const p of shopData.items) {
    if (HIDDEN.has(p.slug)) continue;
    const fam = programFamily(p);
    if (fam) {
      const k = `ltp-${fam.year}`;
      if (!seen.has(k)) {
        const rec = { ...p, shelf: "Programs", family: k, title: `Long Term Program: The Photobook (${fam.year})`, payments: [] };
        seen.set(k, rec);
        out.push(rec);
      }
      const rec = seen.get(k);
      rec.payments.push({ ...fam, slug: p.slug, price: p.from });
      if (fam.payments === 1) { rec.slug = p.slug; rec.from = p.from; }
      continue;
    }
    out.push({ ...p, shelf: shelfOf(p) });
  }
  return out;
}

export function programSiblings(slug) {
  const p = shopData.items.find((x) => x.slug === slug);
  const fam = p && programFamily(p);
  if (!fam) return null;
  return shopData.items
    .map((x) => ({ x, f: programFamily(x) }))
    .filter(({ f }) => f && f.year === fam.year)
    .map(({ x, f }) => ({ slug: x.slug, payments: f.payments, price: x.from }))
    .sort((a, b) => a.payments - b.payments);
}

export const PROMO = new Set(["Workshops", "Fall Promo", "Flash Sale", "Thanksgiving Promo"]);

export function listFor(kind) {
  return kind === "online" ? onlineData : workshopsData;
}

export function techniques(items) {
  const c = new Map();
  for (const w of items) for (const k of w.categories) if (!PROMO.has(k)) c.set(k, (c.get(k) || 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function isOpen(w) {
  return !w.soldOut;
}

export function memberPrice(w) {
  const m = w.variants?.filter((v) => /member/i.test(v.label) && !/new member/i.test(v.label)).map((v) => v.price);
  return m && m.length ? Math.min(...m) : null;
}

export function publicPrice(w) {
  const v = w.variants?.find((x) => /^tuition$/i.test(x.label.trim())) || w.variants?.find((x) => !/member/i.test(x.label));
  return v ? v.price : w.to;
}
