import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { loadSearch } from "../lib/content";
import { cdn } from "../lib/img";
import { useUI } from "../lib/store";
import { SearchIcon, CloseIcon } from "./Icons";

export function rank(index, q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const out = [];
  for (const r of index) {
    const t = r.t.toLowerCase(), k = (r.k || "").toLowerCase(), x = (r.x || "").toLowerCase();
    let s = 0, all = true;
    for (const w of terms) {
      const hit = (t.includes(w) ? 6 : 0) + (k.includes(w) ? 2 : 0) + (x.includes(w) ? 1 : 0);
      if (!hit) { all = false; break; }
      s += hit + (t.startsWith(w) ? 3 : 0);
    }
    if (all) out.push([s + (r.y === "Workshop" ? 1.5 : 0), r]);
  }
  return out.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
}

export default function SearchDialog() {
  const { searchRef, closeSearch } = useUI();
  const [index, setIndex] = useState(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    const d = searchRef.current;
    if (!d) return;
    const onOpen = () => { if (!index) loadSearch().then(setIndex).catch(() => setIndex([])); };
    const obs = new MutationObserver(() => d.open && onOpen());
    obs.observe(d, { attributes: true, attributeFilter: ["open"] });
    return () => obs.disconnect();
  }, [searchRef, index]);

  const results = useMemo(() => (index ? rank(index, q).slice(0, 12) : []), [index, q]);
  useEffect(() => setSel(0), [q]);

  const go = (u) => { closeSearch(); setQ(""); nav(u, { viewTransition: true }); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[sel]) go(results[sel].u);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <dialog ref={searchRef} className="searchdlg" aria-label="Search Penumbra Foundation"
      onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}>
      <div className="searchbar">
        <SearchIcon />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Search workshops, exhibitions, books…" aria-label="Search" role="combobox"
          aria-expanded={results.length > 0} aria-controls="search-results" aria-activedescendant={results[sel] ? `sr-${sel}` : undefined} />
        <button className="iconbtn" onClick={closeSearch} aria-label="Close search"><CloseIcon /></button>
      </div>
      <ul className="results" id="search-results" role="listbox">
        {!index && q && <li className="muted" style={{ padding: "16px 24px" }}>Loading the index…</li>}
        {index && q && !results.length && <li className="muted" style={{ padding: "16px 24px" }}>Nothing matches “{q}”. Try a process (cyanotype, wet plate), an artist, or a season.</li>}
        {!q && <li className="muted" style={{ padding: "16px 24px" }}>Every page, workshop, class and book on the site — {index ? index.length : "…"} records.</li>}
        {results.map((r, i) => (
          <li key={r.u} role="option" id={`sr-${i}`} aria-selected={i === sel}>
            <a href={r.u} aria-selected={i === sel} onClick={(e) => { e.preventDefault(); go(r.u); }} onMouseEnter={() => setSel(i)}>
              <span className="thumb">{r.i && <img src={cdn(r.i, 300)} alt="" loading="lazy" />}</span>
              <span><span className="t">{r.t}</span><span className="x">{r.x}</span></span>
              <span className="badge">{r.y}</span>
            </a>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
