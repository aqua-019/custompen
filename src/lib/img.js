// Squarespace's image CDN serves width variants via ?format=Nw — we hotlink the
// foundation's own originals and let the browser pick the smallest that fits.
const WIDTHS = [300, 500, 750, 1000, 1500, 2500];

export function cdn(src, w = 1000) {
  if (!src) return "";
  if (!src.includes("squarespace-cdn.com")) return src;
  return `${src.split("?")[0]}?format=${w}w`;
}

export function srcSet(src, natural) {
  if (!src || !src.includes("squarespace-cdn.com")) return undefined;
  const cap = natural ? Math.max(300, natural) : 2500;
  const list = WIDTHS.filter((w) => w <= cap);
  if (!list.length) list.push(300);
  return list.map((w) => `${cdn(src, w)} ${w}w`).join(", ");
}

export function focal(img) {
  if (!img) return undefined;
  const x = Math.round((img.fx ?? 0.5) * 100);
  const y = Math.round((img.fy ?? 0.5) * 100);
  return `${x}% ${y}%`;
}
