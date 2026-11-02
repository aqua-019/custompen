const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export function money(n) {
  if (n == null || Number.isNaN(n)) return "";
  return Number.isInteger(n) ? usd0.format(n) : usd2.format(n);
}

export function fromDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const monthKey = (iso) => (iso ? iso.slice(0, 7) : "undated");

export function monthLabel(key) {
  if (!key || key === "undated") return "Dates to be announced";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function dayParts(iso) {
  const d = fromDate(iso);
  if (!d) return { day: "—", dow: "TBA", mon: "" };
  return {
    day: d.getDate(),
    dow: d.toLocaleDateString("en-US", { weekday: "short" }),
    mon: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

export function shortDate(iso) {
  const d = fromDate(iso);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
}

export function decode(s = "") {
  return s.replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");
}

export function stripTags(html = "") {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export const ORIGIN = "https://www.penumbrafoundation.org";
