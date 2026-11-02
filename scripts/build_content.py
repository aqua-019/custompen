"""Convert the Squarespace ?format=json crawl of penumbrafoundation.org into
clean, design-agnostic content JSON for the CUSTOMPEN front end.

usage: python3 -I scripts/build_content.py <crawl_raw_dir> <acuity_business.json> <repo_root>
"""
import html as htmllib
import json
import os
import re
import sys
from datetime import date
from urllib.parse import urlparse

from bs4 import BeautifulSoup, NavigableString, Tag

RAW, ACUITY, ROOT = sys.argv[1], sys.argv[2], sys.argv[3]
SITE = "https://www.penumbrafoundation.org"
OUT_PAGES = os.path.join(ROOT, "public/content/pages")
OUT_DATA = os.path.join(ROOT, "src/data")
os.makedirs(OUT_PAGES, exist_ok=True)
os.makedirs(OUT_DATA, exist_ok=True)
TODAY = date(2026, 11, 2)

ALLOWED = {"p", "h2", "h3", "h4", "strong", "em", "a", "ul", "ol", "li", "br", "blockquote", "sup", "sub", "s", "hr", "table", "thead", "tbody", "tr", "td", "th", "iframe", "img", "figure", "figcaption"}
RENAME = {"b": "strong", "i": "em", "h1": "h2", "h5": "h4", "h6": "h4"}
ZW = re.compile(r"[​‌‍﻿ \s]+")
log = {"dropped_links": {}, "external_links": set()}

# ---------------------------------------------------------------- helpers

def load(p):
    with open(p) as f:
        return json.load(f)


def slug_of(path):
    return path.strip("/").replace("/", "__") or "_home"


def img_rec(url, dims=None, focal=None, alt=""):
    if not url:
        return None
    url = url.split("?")[0]
    if url.startswith("//"):
        url = "https:" + url
    w = h = None
    if dims and "x" in str(dims):
        try:
            w, h = [int(float(x)) for x in str(dims).split("x")[:2]]
        except ValueError:
            pass
    fx = fy = 0.5
    if isinstance(focal, dict):
        fx, fy = focal.get("x", 0.5), focal.get("y", 0.5)
    elif isinstance(focal, str) and "," in focal:
        try:
            fx, fy = [float(v) for v in focal.split(",")[:2]]
        except ValueError:
            pass
    alt = (alt or "").strip()
    if re.search(r"\.(jpe?g|png|gif|webp|tiff?)$", alt, re.I) or re.match(r"^(img|dsc|image|screen ?shot)[\s_-]?\d", alt, re.I):
        alt = ""
    return {"src": url, "w": w, "h": h, "fx": round(fx, 3), "fy": round(fy, 3), "alt": alt}


KNOWN_ROUTES = set()   # filled before cleaning
BLANK = set(json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "blank_heroes.json"))))
APPLY_URL = "https://site.picter.com/penumbra-foundation-residency-programs-2026"
ALIASES = {"/2025-residents": "/workspace-residency-2025", "/2023-residents": "/2023-residentsa", "/2022-residents": "/2022-residents-1",
           "/members-gallery-deborah-francis": "/members-gallery-debora-francis", "/2018-residents-1": "/2017-residents-1", "/project-space": "/project-gallery-current"}


def rewrite_href(href, page):
    if not href:
        return None
    href = htmllib.unescape(href.strip())
    if href.startswith(("mailto:", "tel:")):
        return href
    if href.startswith("#"):
        return None
    if href.startswith("//"):
        href = "https:" + href
    if "February 28" in href or "11:59PM" in href:
        return APPLY_URL
    if re.fullmatch(r"[a-z0-9-]+", href) and "/" + href in KNOWN_ROUTES:
        return "/" + href
    m0 = re.fullmatch(r"/?(?:www\.)?([a-z0-9-]+\.(?:com|org|net|art|studio))/?", href)
    if m0:
        return "https://" + m0.group(1)
    p = urlparse(href)
    if p.scheme in ("http", "https"):
        host = (p.netloc or "").lower()
        if "." not in host and "/" + host in KNOWN_ROUTES:
            return "/" + host
        if " " in host or "." not in host:
            log["dropped_links"].setdefault(page, []).append(href)
            return None
        if host.endswith("penumbrafoundation.org") and not host.startswith("photobooks"):
            path = p.path or "/"
        else:
            log["external_links"].add(host)
            return href
    elif href.startswith("/"):
        path = p.path
    else:
        log["dropped_links"].setdefault(page, []).append(href)
        return None
    path = re.sub(r"/+$", "", path) or "/"
    path = ALIASES.get(path, path)
    if path.startswith("/s/") or re.search(r"\.(pdf|jpe?g|png|zip|docx?)$", path, re.I):
        return SITE + path
    if path in KNOWN_ROUTES or path == "/":
        return path + (("?" + p.query) if p.query else "")
    if path.startswith(("/cart", "/account", "/checkout", "/commerce")):
        return "/cart"
    log["dropped_links"].setdefault(page, []).append(path)
    return None


def clean_fragment(node, page):
    """Return sanitised inner HTML of node."""
    out = []

    def walk(n):
        if isinstance(n, NavigableString):
            if n.__class__.__name__ in ("Comment", "Doctype", "Declaration", "ProcessingInstruction"):
                return
            out.append(htmllib.escape(str(n), quote=False))
            return
        if not isinstance(n, Tag):
            return
        name = RENAME.get(n.name, n.name)
        if n.name in ("script", "style", "noscript", "button", "svg", "form", "input", "select", "textarea"):
            return
        if name == "a":
            href = rewrite_href(n.get("href"), page)
            if href:
                out.append('<a href="%s">' % htmllib.escape(href))
                for c in n.children:
                    walk(c)
                out.append("</a>")
            else:
                for c in n.children:
                    walk(c)
            return
        if name == "iframe":
            src = n.get("src") or n.get("data-src") or ""
            if src.startswith("//"):
                src = "https:" + src
            if src.startswith("https://"):
                out.append('<iframe src="%s" title="%s" loading="lazy" allowfullscreen></iframe>' % (htmllib.escape(src), htmllib.escape(n.get("title") or "Embedded media")))
            return
        if name == "img":
            src = n.get("data-src") or n.get("src") or ""
            if src.startswith("//"):
                src = "https:" + src
            if src.startswith("https://"):
                out.append('<img src="%s" alt="%s" loading="lazy">' % (htmllib.escape(src), htmllib.escape(n.get("alt") or "")))
            return
        if name in ALLOWED:
            if name in ("br", "hr"):
                out.append("<%s>" % name)
                return
            out.append("<%s>" % name)
            for c in n.children:
                walk(c)
            out.append("</%s>" % name)
        else:
            for c in n.children:
                walk(c)

    for c in node.children:
        walk(c)
    s = "".join(out)
    # drop empty paragraphs / headings
    for _ in range(3):
        s = re.sub(r"<(p|h2|h3|h4|li|strong|em)>(?:\s|&nbsp;| |​|‍|﻿|<br>)*</\1>", "", s)
    s = re.sub(r"(<br>\s*){3,}", "<br><br>", s)
    s = s.replace("‍", "").replace("​", "").replace("﻿", "")
    return s.strip()


def jattr(v):
    for cand in (v, htmllib.unescape(v or "")):
        try:
            return json.loads(cand)
        except Exception:
            pass
    return {}


def text_of(html):
    return ZW.sub(" ", BeautifulSoup(html or "", "lxml").get_text(" ")).strip()


# ---------------------------------------------------------------- blocks

def parse_block(b, page):
    classes = b.get("class") or []
    btype = b.get("data-block-type")
    defn = b.get("data-definition-name") or ""
    content = b.find(class_="sqs-block-content") or b
    if "spacer" in defn or "spacer-block" in classes:
        return None
    if btype == "2" or "html-block" in classes:
        h = clean_fragment(content.find(class_="sqs-html-content") or content, page)
        return {"t": "html", "html": h} if text_of(h) or "<img" in h or "<iframe" in h else None
    if "horizontalrule" in defn:
        return {"t": "hr"}
    if btype == "5" or "image-block" in classes:
        img = content.find("img")
        if not img:
            return None
        rec = img_rec(img.get("data-src") or img.get("data-image") or img.get("src"), img.get("data-image-dimensions"), img.get("data-image-focal-point"), img.get("alt"))
        if not rec:
            return None
        blk = {"t": "img", **rec}
        a = content.find("a", href=True)
        if a:
            h = rewrite_href(a["href"], page)
            if h:
                blk["href"] = h
        cap = content.find(class_="image-caption") or content.find("figcaption")
        if cap:
            c = clean_fragment(cap, page)
            if text_of(c):
                blk["caption"] = c
        title = content.find(class_="image-title")
        if title and text_of(str(title)):
            blk["title"] = text_of(str(title))
        sub = content.find(class_="image-subtitle")
        if sub:
            c = clean_fragment(sub, page)
            if text_of(c):
                blk["subtitle"] = c
        btn = content.find(class_=re.compile("image-button"))
        if btn and btn.find("a", href=True):
            h = rewrite_href(btn.find("a")["href"], page)
            if h:
                blk["button"] = {"href": h, "label": text_of(str(btn.find("a")))}
        return blk
    if btype == "8" or "gallery-block" in classes:
        box = content.find(class_=re.compile("sqs-gallery-container")) or content
        cls = " ".join(box.get("class") or [])
        layout = "grid"
        for k in ("slideshow", "carousel", "stacked", "grid"):
            if "gallery-block-" + k in cls or "sqs-gallery-design-" + k in cls:
                layout = k
                break
        per = re.search(r"thumbnails-per-row-(\d+)", cls)
        imgs = []
        for sl in box.find_all(class_="slide"):
            im = sl.find("img", attrs={"data-src": True}) or sl.find("img")
            if not im:
                continue
            rec = img_rec(im.get("data-src") or im.get("data-image") or im.get("src"), im.get("data-image-dimensions"), im.get("data-image-focal-point"), im.get("alt"))
            if not rec:
                continue
            a = sl.find("a")
            title = (a.get("data-title") if a else "") or ""
            desc = (a.get("data-description") if a else "") or ""
            if title and not re.search(r"\.(jpe?g|png)$", title, re.I):
                rec["title"] = text_of(title)
            if desc:
                d = clean_fragment(BeautifulSoup(desc, "lxml").body or BeautifulSoup(desc, "lxml"), page)
                if text_of(d):
                    rec["caption"] = d
            meta = sl.find(class_=re.compile("image-slide-title|meta-title"))
            if meta and "title" not in rec and text_of(str(meta)):
                rec["title"] = text_of(str(meta))
            if a and a.get("href") and not a["href"].startswith("https://images.squarespace-cdn"):
                h = rewrite_href(a["href"], page)
                if h:
                    rec["href"] = h
            imgs.append(rec)
        if not imgs:
            return None
        return {"t": "gallery", "layout": layout, "per": int(per.group(1)) if per else None, "images": imgs}
    if "components.button" in defn:
        a = content.find("a", href=True)
        if not a:
            return None
        h = rewrite_href(a["href"], page)
        label = text_of(str(a))
        if not label:
            return None
        return {"t": "button", "href": h or SITE + "/", "label": label, "external": not h}
    if "components.quote" in defn:
        bq = content.find("blockquote")
        src = content.find(class_="source") or content.find("figcaption")
        q = clean_fragment(bq, page) if bq else ""
        q = re.sub(r"^\s*[“\"]|[”\"]\s*$", "", re.sub(r"<[^>]+>", lambda m: m.group(0), q)).strip()
        return {"t": "quote", "html": q, "source": text_of(str(src)).lstrip("—– -") if src else ""} if text_of(q) else None
    if "components.accordion" in defn:
        items = []
        for li in content.find_all("li", class_="accordion-item"):
            t = li.find(class_="accordion-item__title")
            d = li.find(class_="accordion-item__description")
            items.append({"title": text_of(str(t)) if t else "", "html": clean_fragment(d, page) if d else ""})
        return {"t": "accordion", "items": items} if items else None
    if "components.code" in defn or "components.markdown" in defn:
        box = content.find(class_="sqs-code-container") or content.find(class_="markdown-block") or content
        h = clean_fragment(box, page)
        return {"t": "html", "html": h} if text_of(h) or "<iframe" in h or "<img" in h else None
    if "components.video" in defn or "components.embed" in defn:
        wrap = content.find(attrs={"data-html": True})
        raw = wrap.get("data-html") if wrap else str(content)
        m = re.search(r'src="([^"]+)"', htmllib.unescape(raw))
        if not m:
            return None
        src = m.group(1)
        if src.startswith("//"):
            src = "https:" + src
        tm = re.search(r'title="([^"]*)"', htmllib.unescape(raw))
        return {"t": "video", "src": src, "title": tm.group(1) if tm else "Video"}
    if "components.product" in defn:
        pb = content.find(attrs={"data-product": True})
        if not pb:
            return None
        pd = jattr(pb["data-product"])
        if not pd:
            return None
        img = None
        for v in pd.get("variants", []):
            mi = v.get("mainImage") or {}
            if mi.get("assetUrl"):
                img = img_rec(mi["assetUrl"], mi.get("originalSize"), mi.get("mediaFocalPoint"))
                break
        if not img:
            mi = pd.get("mainImage") or {}
            img = img_rec(mi.get("assetUrl"), mi.get("originalSize"), mi.get("mediaFocalPoint"))
        return {"t": "product", "id": pd.get("id"), "title": pd.get("title"), "from": (pd.get("fromPrice") or {}).get("value"), "soldOut": pd.get("soldOut"), "img": img}
    if "components.acuity" in defn:
        w = content.find(class_="acuity-block-wrapper")
        return {"t": "acuity", "calendarId": w.get("data-calendar-id") if w else None, "appointmentTypeId": (w.get("data-appointment-type-id") or None) if w else None, "category": (w.get("data-category") or None) if w else None}
    if "components.donation" in defn:
        w = content.find(attrs={"data-block-context": True})
        ctx = jattr(w["data-block-context"]) if w else {}
        return {"t": "donate", "label": ctx.get("buttonText") or "Donate", "href": SITE + page}
    if "components.map" in defn:
        w = content.find(attrs={"data-context": True})
        ctx = jattr(w["data-context"]) if w else {}
        loc = ctx.get("location") or {}
        return {"t": "map", "lat": loc.get("markerLat"), "lng": loc.get("markerLng"), "title": loc.get("addressTitle"), "line1": loc.get("addressLine1"), "line2": loc.get("addressLine2")}
    if "components.form" in defn:
        sc = content.find("script", attrs={"type": "application/json"})
        fields, submit, name = [], "Submit", ""
        if sc:
            try:
                fc = json.loads(sc.string)
                form = fc.get("form") or {}
                name = form.get("name") or ""
                submit = form.get("submitButtonText") or "Submit"
                for f in form.get("fields", []):
                    if isinstance(f, str):
                        f = json.loads(f)
                    fields.append({"type": f.get("type"), "title": f.get("title") or f.get("type"), "required": bool(f.get("required"))})
            except Exception:
                pass
        return {"t": "form", "name": name, "fields": fields, "submit": submit}
    # unknown — keep any text
    h = clean_fragment(content, page)
    return {"t": "html", "html": h} if text_of(h) else None


def parse_layout(container, page):
    """Return list of nodes: blocks and {'t':'row','cols':[{'span','nodes'}]}"""
    nodes = []
    for child in container.find_all(recursive=False):
        cls = child.get("class") or []
        if "row" in cls:
            cols = []
            for col in child.find_all(recursive=False):
                cc = col.get("class") or []
                if "col" not in cc:
                    continue
                span = next((int(c.split("-")[1]) for c in cc if re.fullmatch(r"span-\d+", c)), 12)
                inner = parse_layout(col, page)
                if inner:
                    cols.append({"span": span, "nodes": inner})
            if not cols:
                continue
            if len(cols) == 1:
                nodes.extend(cols[0]["nodes"])
            else:
                nodes.append({"t": "row", "cols": cols})
        elif "sqs-block" in cls:
            b = parse_block(child, page)
            if b:
                nodes.append(b)
        elif "col" in cls:
            nodes.extend(parse_layout(child, page))
        else:
            nodes.extend(parse_layout(child, page))
    # collapse consecutive hr
    out = []
    for n in nodes:
        if n.get("t") == "hr" and (not out or out[-1].get("t") == "hr"):
            continue
        out.append(n)
    while out and out[-1].get("t") == "hr":
        out.pop()
    return out


def parse_html_layout(html, page):
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    lay = soup.find(class_="sqs-layout")
    if lay:
        return parse_layout(lay, page)
    body = soup.body or soup
    h = clean_fragment(body, page)
    return [{"t": "html", "html": h}] if text_of(h) else []


def walk_nodes(nodes):
    for n in nodes:
        yield n
        if n.get("t") == "row":
            for c in n["cols"]:
                yield from walk_nodes(c["nodes"])


# ---------------------------------------------------------------- route set
pages_dir = os.path.join(RAW, "pages")
items_dir = os.path.join(RAW, "items")
page_files = {}
for fn in os.listdir(pages_dir):
    if not fn.endswith(".json"):
        continue
    d = load(os.path.join(pages_dir, fn))
    slug = "/" + fn[:-5].replace("__", "/")
    if slug == "/_home":
        slug = "/"
    page_files[slug] = d
item_files = {}
for fn in os.listdir(items_dir):
    d = load(os.path.join(items_dir, fn))
    if "item" not in d:
        continue
    item_files["/" + fn[:-5].replace("__", "/")] = d

KNOWN_ROUTES.update(page_files.keys())
KNOWN_ROUTES.update(item_files.keys())
KNOWN_ROUTES.update({"/online-courses", "/search", "/cart"})

# ---------------------------------------------------------------- nav from homepage html
home_html = open(os.path.join(os.path.dirname(RAW), "home.html")).read()
soup = BeautifulSoup(home_html, "lxml")
nav = []
mainnav = soup.find("nav", class_="main-nav")
for li in mainnav.select("ul.cf > li"):
    parent = li.find(class_="folder-parent")
    if parent:
        title = text_of(str(parent.find("a")))
        links = []
        for a in li.select("ul.folder-child a"):
            href = a.get("href")
            label = text_of(str(a))
            h = rewrite_href(href, "/nav") or href
            links.append({"label": label, "href": h, "external": h.startswith("http")})
        nav.append({"title": title, "links": links})

# ---------------------------------------------------------------- pricing helpers

def money(v):
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return None


def variants_of(it):
    out = []
    for v in it.get("variants") or (it.get("structuredContent") or {}).get("variants") or []:
        price = money((v.get("priceMoney") or {}).get("value"))
        if price is None and v.get("price") is not None:
            price = v["price"] / 100
        sale = money((v.get("salePriceMoney") or {}).get("value")) if v.get("onSale") else None
        label = " / ".join(str(x) for x in (v.get("attributes") or {}).values()) or "Standard"
        unlimited = bool(v.get("unlimited"))
        qty = v.get("qtyInStock") or 0
        out.append({"id": v.get("id"), "label": label, "price": price, "sale": sale, "available": unlimited or qty > 0, "qty": None if unlimited else qty})
    return out


MONTHS = {m: i for i, m in enumerate(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"], 1)}
MONTH_RE = re.compile(r"\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})", re.I)


def month_num(tok):
    tok = tok.lower()[:3]
    for name, i in MONTHS.items():
        if name.startswith(tok):
            return i
    return None


def parse_dates(s):
    found = []
    for m in MONTH_RE.finditer(s or ""):
        mn = month_num(m.group(1))
        d = int(m.group(2))
        if mn and 1 <= d <= 31:
            found.append((mn, d))
    if not found:
        return None, None
    def to_date(mn, d):
        y = TODAY.year if mn >= TODAY.month - 2 else TODAY.year + 1
        try:
            return date(y, mn, d)
        except ValueError:
            return None
    start = to_date(*found[0])
    end = to_date(*found[-1]) if len(found) > 1 else None
    if start and end and end < start:
        end = date(end.year + 1, end.month, end.day)
    return start, end


def split_title(title):
    title = htmllib.unescape(title or "").strip()
    name, when = title, ""
    if ":" in title:
        head, tail = title.rsplit(":", 1)
        if MONTH_RE.search(tail) or re.search(r"(mon|tues|wednes|thurs|fri|satur|sun)days?", tail, re.I):
            name, when = head.strip(), tail.strip()
    instructor = ""
    m = re.search(r"\bwith\s+(.+)$", name)
    if m:
        instructor = m.group(1).strip()
        name_short = name[: m.start()].strip()
    else:
        name_short = name
    return {"full": title, "name": name, "short": name_short, "instructor": instructor, "when": when}


def facts_from_text(t):
    facts = {}
    m = re.search(r"Class Size(?: Max)?:?\s*(\d+)", t, re.I)
    if m:
        facts["classSize"] = int(m.group(1))
    m = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM))", t, re.I)
    if m:
        facts["time"] = re.sub(r"\s*[-–]\s*", " – ", m.group(1)).upper().replace("  ", " ")
    m = re.search(r"\$(\d+)\s*materials fee", t, re.I)
    if m:
        facts["materials"] = int(m.group(1))
    m = re.search(r"((?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days?(?:\s*(?:&|and|,)\s*(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days?)*)", t)
    if m:
        facts["days"] = m.group(1)
    if re.search(r"\bzoom\b|online", t, re.I):
        facts["online"] = True
    return facts


def product(it, kind):
    full = it.get("fullUrl")
    body_nodes = parse_html_layout(it.get("body") or "", full)
    body_text = " ".join(text_of(n.get("html", "")) for n in walk_nodes(body_nodes) if n.get("t") == "html")
    imgs = []
    for x in it.get("items") or []:
        r = img_rec(x.get("assetUrl"), x.get("originalSize"), x.get("mediaFocalPoint"), x.get("title"))
        if r:
            imgs.append(r)
    if not imgs and it.get("assetUrl"):
        imgs.append(img_rec(it.get("assetUrl"), it.get("originalSize"), it.get("mediaFocalPoint")))
    vs = variants_of(it)
    prices = [v["sale"] or v["price"] for v in vs if v["price"] is not None]
    sold_out = bool(vs) and not any(v["available"] for v in vs)
    t = split_title(it.get("title"))
    start, end = parse_dates(t["when"] or t["full"] + " " + body_text[:200])
    excerpt = clean_fragment(BeautifulSoup(it.get("excerpt") or "", "lxml").body or BeautifulSoup("", "lxml"), full) if it.get("excerpt") else ""
    credit = ""
    m = re.search(r"Images?\s*©\s*([^<\n]+?)(?:\s*$|\s{2,}|<)", text_of(excerpt) + "  ")
    if m:
        credit = m.group(1).strip()
    sub = (it.get("structuredContent") or {})
    rec = {
        "id": it.get("id"),
        "kind": kind,
        "slug": full,
        "title": t["full"],
        "name": t["name"],
        "short": t["short"],
        "instructor": t["instructor"],
        "when": t["when"],
        "start": start.isoformat() if start else None,
        "end": end.isoformat() if end else None,
        "categories": [c for c in (it.get("categories") or [])],
        "tags": it.get("tags") or [],
        "images": imgs,
        "variants": vs,
        "from": min(prices) if prices else None,
        "to": max(prices) if prices else None,
        "soldOut": sold_out,
        "subscription": bool(it.get("isSubscribable")),
        "credit": credit,
        "facts": facts_from_text(body_text),
        "body": body_nodes,
        "summary": body_text[:260],
        "updated": it.get("updatedOn"),
        "added": it.get("addedOn"),
        "productType": it.get("productType") or sub.get("productType"),
    }
    return rec


# ---------------------------------------------------------------- collections
workshops_list = page_files["/workshops"]
workshops = []
for it in workshops_list.get("items", []):
    full = it["fullUrl"]
    det = item_files.get(full, {}).get("item") or it
    workshops.append(product(det, "workshop"))
workshops.sort(key=lambda w: (w["start"] or "9999", w["title"]))

store_list = page_files["/penumbra-store"]
shop = []
for it in store_list.get("items", []):
    det = item_files.get(it["fullUrl"], {}).get("item") or it
    shop.append(product(det, "shop"))

online_list = page_files.get("/online-courses", {})
online = []
for it in online_list.get("items", []):
    det = item_files.get(it["fullUrl"], {}).get("item") or it
    online.append(product(det, "online"))
online.sort(key=lambda w: (w["start"] or "9999", w["title"]))

# workshop + shop categories (counts)
def cat_counts(lst):
    c = {}
    for x in lst:
        for k in x["categories"]:
            c[k] = c.get(k, 0) + 1
    return c

# ---------------------------------------------------------------- home slides
home = page_files["/"]
slides = []
for it in home.get("items", []):
    body = it.get("description") or it.get("body") or ""
    frag = clean_fragment(BeautifulSoup(body, "lxml").body or BeautifulSoup("", "lxml"), "/")
    links = re.findall(r'<a href="([^"]+)">(.*?)</a>', frag)
    slides.append({
        "title": htmllib.unescape(it.get("title") or ""),
        "html": frag,
        "links": [{"href": htmllib.unescape(h), "label": text_of(l)} for h, l in links],
        "img": img_rec(it.get("assetUrl"), it.get("originalSize"), it.get("mediaFocalPoint")),
    })

# ---------------------------------------------------------------- pages
SECTION_OF = {}
for folder in nav:
    for l in folder["links"]:
        if not l["external"]:
            SECTION_OF[l["href"]] = folder["title"]

pages_index = []
for slug, d in sorted(page_files.items()):
    if slug in ("/", "/workshops", "/penumbra-store", "/online-courses"):
        continue
    if "item" in d:
        continue  # collection item pages handled above
    c = d.get("collection", {})
    nodes = parse_html_layout(d.get("mainContent") or "", slug)
    # page title: collection title, split on '|'
    ctitle = htmllib.unescape(c.get("title") or "").strip()
    kicker, title = "", ctitle
    if "|" in ctitle:
        kicker, title = [x.strip() for x in ctitle.split("|", 1)]
    first_heading = None
    for n in nodes[:4]:
        if n.get("t") == "html":
            m = re.match(r"\s*<(h2|h3)>(.*?)</\1>", n["html"], re.S)
            if m:
                first_heading = text_of(m.group(2))
            break
    generic = (not title) or re.fullmatch(r"(?i)(nyc|us)[ –-]*(based)?\s*\d{0,4}|new york city[–-]based|us[–-]based|workspace resident \d{4}|penumbra (members gallery|project space)|project (space|gallery)|facility rental|online learning", title or "")
    if generic and first_heading and len(first_heading) < 90:
        kicker = kicker or title
        title = first_heading
        # remove that heading from the first html block
        for n in nodes[:4]:
            if n.get("t") == "html":
                n["html"] = re.sub(r"^\s*<(h2|h3)>.*?</\1>", "", n["html"], count=1, flags=re.S).strip()
                break
    if not title:
        title = (c.get("navigationTitle") or slug.strip("/").replace("-", " ")).strip()
    hero = None
    mi = c.get("mainImage")
    if mi and mi.get("assetUrl") and mi["assetUrl"].split("?")[0] not in BLANK:
        hero = img_rec(mi["assetUrl"], mi.get("originalSize"), mi.get("mediaFocalPoint"))
    desc_html = ""
    if c.get("description"):
        desc_html = clean_fragment(BeautifulSoup(c["description"], "lxml").body or BeautifulSoup("", "lxml"), slug)
    seo = c.get("seoData") or {}
    first_img = next((n for n in walk_nodes(nodes) if n.get("t") == "img"), None)
    if not first_img:
        g = next((n for n in walk_nodes(nodes) if n.get("t") == "gallery"), None)
        first_img = g["images"][0] if g else None
    plain = " ".join(text_of(n.get("html", "")) for n in walk_nodes(nodes) if n.get("t") in ("html",))
    rec = {
        "slug": slug,
        "title": title,
        "kicker": kicker,
        "section": SECTION_OF.get(slug, ""),
        "hero": hero,
        "description": desc_html,
        "seoTitle": seo.get("seoTitle") or "",
        "seoDescription": seo.get("seoDescription") or plain[:180],
        "nodes": [n for n in nodes if not (n.get("t") == "html" and not n["html"])],
        "updated": c.get("updatedOn"),
    }
    with open(os.path.join(OUT_PAGES, slug_of(slug) + ".json"), "w") as f:
        json.dump(rec, f, ensure_ascii=False, separators=(",", ":"))
    pages_index.append({
        "slug": slug, "title": title, "kicker": kicker, "section": rec["section"],
        "thumb": (hero or first_img or {}).get("src") if (hero or first_img) else None,
        "text": plain[:600],
    })

# ---------------------------------------------------------------- acuity tintype
biz = load(ACUITY)
tintype_types = []
for cat, lst in biz["appointmentTypes"].items():
    for a in lst:
        if cat == "Tintype Studio":
            tintype_types.append({
                "id": a["id"], "name": a["name"].strip(), "price": money(a.get("price")), "duration": a.get("duration"),
                "calendarIds": a.get("calendarIDs"),
                "description": text_of(a.get("description") or ""),
            })
gift = [{"id": p["id"], "title": p["title"], "price": p["price"]} for p in (biz.get("products") or {}).get("Tintype Studio", [])]
tintype = {"ownerKey": biz["ownerKey"], "owner": biz["id"], "timezone": biz["timezone"], "types": tintype_types, "giftCards": gift,
           "catalogUrl": "https://app.acuityscheduling.com/catalog.php?owner=%s" % biz["id"]}

# ---------------------------------------------------------------- membership (from tier pages)
tiers = []
for slug in ["/student-membership", "/educator-membership", "/individual-membership", "/dual-membership", "/pf-membership", "/pro-studio-membership", "/patron-membership"]:
    d = page_files[slug]
    m = re.search(r"buttonText&quot;:&quot;([^&]*)", d["mainContent"]) or re.search(r'"buttonText":"([^"]*)', d["mainContent"])
    btn = htmllib.unescape(m.group(1)) if m else ""
    pm = re.search(r"\$(\d[\d,]*)", btn)
    s = BeautifulSoup(d["mainContent"], "lxml")
    lede = ""
    for p in s.find_all("p"):
        t = text_of(str(p))
        if len(t) > 60:
            lede = t
            break
    tiers.append({"slug": slug, "name": re.sub(r"\s*MEMBERSHIP\s*$", "", htmllib.unescape(page_files[slug]["collection"]["title"]).strip(), flags=re.I).title(),
                  "price": int(pm.group(1).replace(",", "")) if pm else None, "button": btn, "lede": lede})

# ---------------------------------------------------------------- write data
def dump(name, obj):
    with open(os.path.join(OUT_DATA, name), "w") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))

def lite(p):
    return {k: p[k] for k in ("id", "kind", "slug", "title", "name", "short", "instructor", "when", "start", "end", "categories", "from", "to", "soldOut", "subscription", "facts", "credit", "summary")} | {"images": p["images"][:2], "variants": p["variants"]}

dump("site.json", {
    "nav": nav,
    "address": "36 East 30th Street, New York, NY 10016",
    "phone": "917-288-0343",
    "email": "info@penumbrafoundation.org",
    "social": [{"label": "Instagram", "href": "https://www.instagram.com/penumbrafoundation/"}, {"label": "Facebook", "href": "https://www.facebook.com/penumbrafoundation"}],
    "sponsors": ["Phillip and Edith Leonian Foundation", "Jacques and Natasha Gelman Foundation", "Fujifilm", "Lawrence Foundation", "Ruth Arts", "New York City Department of Cultural Affairs", "New York State Council on the Arts", "The Joy of Giving Something Inc."],
    "siteDescription": text_of(home["website"].get("siteDescription") or ""),
})
dump("home.json", {"slides": slides})
dump("workshops.json", {"items": [lite(w) for w in workshops], "categories": cat_counts(workshops)})
dump("online.json", {"items": [lite(w) for w in online], "categories": cat_counts(online)})
dump("shop.json", {"items": [lite(p) for p in shop], "categories": cat_counts(shop)})
dump("tintype.json", tintype)
dump("membership.json", {"tiers": tiers})
os.makedirs(os.path.join(ROOT, "public/content/items"), exist_ok=True)
for p in workshops + shop + online:
    with open(os.path.join(ROOT, "public/content/items", slug_of(p["slug"]) + ".json"), "w") as f:
        json.dump(p, f, ensure_ascii=False, separators=(",", ":"))

# search index (lean)
search = []
for p in pages_index:
    search.append({"u": p["slug"], "t": p["title"], "k": p["kicker"] or p["section"], "x": p["text"][:300], "i": p["thumb"], "y": "Page"})
for p in workshops:
    search.append({"u": p["slug"], "t": p["title"], "k": "Workshop", "x": p["summary"], "i": p["images"][0]["src"] if p["images"] else None, "y": "Workshop"})
for p in online:
    search.append({"u": p["slug"], "t": p["title"], "k": "Online class", "x": p["summary"], "i": p["images"][0]["src"] if p["images"] else None, "y": "Online"})
for p in shop:
    search.append({"u": p["slug"], "t": p["title"], "k": "Shop", "x": p["summary"], "i": p["images"][0]["src"] if p["images"] else None, "y": "Shop"})
with open(os.path.join(ROOT, "public/content/search.json"), "w") as f:
    json.dump(search, f, ensure_ascii=False, separators=(",", ":"))
dump("routes.json", sorted(set([p["slug"] for p in pages_index] + [p["slug"] for p in workshops + shop + online])))

print("pages", len(pages_index), "workshops", len(workshops), "shop", len(shop), "online", len(online), "slides", len(slides))
print("tintype types", [(t["name"], t["price"]) for t in tintype_types])
print("tiers", [(t["name"], t["price"]) for t in tiers])
dl = log["dropped_links"]
print("pages with dropped links", len(dl), "total", sum(len(v) for v in dl.values()))
for k, v in list(dl.items())[:25]:
    print("  ", k, v[:6])
