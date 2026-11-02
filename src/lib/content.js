import { useEffect, useState } from "react";

const cache = new Map();

export const fileFor = (path) => (path.replace(/^\/+|\/+$/g, "").replace(/\//g, "__") || "_home");

async function getJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const p = fetch(url).then(async (r) => {
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.includes("json")) throw Object.assign(new Error("missing"), { missing: true });
    return r.json();
  });
  cache.set(url, p);
  p.catch(() => cache.delete(url));
  return p;
}

export function useJSON(url) {
  const [state, setState] = useState({ status: "loading", data: null });
  useEffect(() => {
    let live = true;
    if (!url) return;
    setState((s) => (s.data && s.url === url ? s : { status: "loading", data: null, url }));
    getJSON(url)
      .then((data) => live && setState({ status: "ok", data, url }))
      .catch((e) => live && setState({ status: e.missing ? "missing" : "error", data: null, url }));
    return () => { live = false; };
  }, [url]);
  return state;
}

export const usePage = (path) => useJSON(`/content/pages/${fileFor(path)}.json`);
export const useItem = (path) => useJSON(`/content/items/${fileFor(path)}.json`);
export const loadSearch = () => getJSON("/content/search.json");
