// Read-only proxy for Penumbra's public Acuity availability (the scheduler's own endpoints,
// which don't send CORS headers). Only the three 8x10 tintype appointment types are allowed.
const OWNER = "72430c79";
const CALENDAR = "14701100";
const TYPES = new Set(["72653816", "72654079", "87590999"]);
const BASE = "https://app.acuityscheduling.com/api/scheduling/v1/availability";
const TZ = "America/New_York";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://local");
  const type = url.searchParams.get("type") || "72653816";
  const month = url.searchParams.get("month");
  const date = url.searchParams.get("date");
  if (!TYPES.has(type)) return send(res, 400, { error: "unknown appointment type" });
  let upstream;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    upstream = `${BASE}/times?owner=${OWNER}&appointmentTypeId=${type}&calendarId=${CALENDAR}&startDate=${date}&timezone=${encodeURIComponent(TZ)}&maxDays=1`;
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    upstream = `${BASE}/month?owner=${OWNER}&appointmentTypeId=${type}&calendarId=${CALENDAR}&timezone=${encodeURIComponent(TZ)}&month=${month}-01`;
  } else {
    return send(res, 400, { error: "pass month=YYYY-MM or date=YYYY-MM-DD" });
  }
  try {
    const r = await fetch(upstream, { headers: { accept: "application/json" } });
    if (!r.ok) return send(res, 502, { error: "scheduler unavailable", status: r.status });
    const data = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return send(res, 200, data);
  } catch {
    return send(res, 502, { error: "scheduler unreachable" });
  }
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
