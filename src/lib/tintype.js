import data from "../data/tintype.json";

export const TYPES = data.types.map((t) => ({
  ...t,
  short: /pro-member/i.test(t.name) ? "Pro member" : /\(member\)/i.test(t.name) ? "Member" : "Non-member",
})).sort((a, b) => b.price - a.price);

export const CALENDAR = TYPES[0]?.calendarIds?.[0];

const memo = new Map();
async function j(url) {
  if (memo.has(url)) return memo.get(url);
  const p = fetch(url).then((r) => {
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error("unavailable");
    return r.json();
  });
  memo.set(url, p);
  p.catch(() => memo.delete(url));
  return p;
}

// live availability from Penumbra's own Acuity calendar, via /api/tintype (a thin read-only proxy)
export const fetchMonth = (type, month) => j(`/api/tintype?type=${type}&month=${month}`);
export const fetchTimes = (type, date) => j(`/api/tintype?type=${type}&date=${date}`);

export function monthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function nextOpenDates(type, n = 6) {
  const now = new Date();
  const months = [0, 1, 2].map((k) => monthStr(new Date(now.getFullYear(), now.getMonth() + k, 1)));
  const res = await Promise.all(months.map((m) => fetchMonth(type, m).catch(() => ({}))));
  const today = now.toISOString().slice(0, 10);
  return res.flatMap((r) => Object.entries(r).filter(([d, ok]) => ok && d >= today).map(([d]) => d)).sort().slice(0, n);
}

export function bookingUrl(typeId, isoTime) {
  // Acuity deep link: appointment type pre-selected; the exact slot is confirmed on Acuity
  const base = `https://app.acuityscheduling.com/schedule.php?owner=${data.owner}&appointmentType=${typeId}&calendarID=${CALENDAR}`;
  return isoTime ? `${base}&date=${isoTime.slice(0, 10)}` : base;
}

export const giftCards = data.giftCards;
export const catalogUrl = data.catalogUrl;
