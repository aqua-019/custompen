"""CUSTOMPEN content extractor.
Reads the Squarespace ?format=json crawl of penumbrafoundation.org and writes
clean, design-neutral JSON the React app renders.  Nothing is invented: every
string and image URL comes from the live site; only structure is normalised.
"""
import json, re, glob, os, html, sys
from bs4 import BeautifulSoup, NavigableString, Tag

SRC = os.environ.get('SRC_DIR', '/tmp/custompen-crawl/json')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(f'{OUT}/pages', exist_ok=True)
os.makedirs(f'{OUT}/items', exist_ok=True)
ORIGIN = 'https://www.penumbrafoundation.org'

def load(slug):
    try:
        return json.load(open(f'{SRC}/{slug}.json'))
    except Exception:
        return None

ALL = {}
for f in glob.glob(f'{SRC}/*.json'):
    slug = os.path.basename(f)[:-5]
    d = load(slug)
    if d: ALL[slug] = d

PAGE_SLUGS = {s for s, d in ALL.items() if '__' not in s and (d.get('mainContent') or '').strip()}
COLLECTIONS = ['workshops', 'online-courses', 'penumbra-store', 'new-products-2', 'tintype-1', 'digital-negatives-1']
ITEM_PATHS = set()
for c in COLLECTIONS:
    for it in (ALL.get(c) or {}).get('items', []):
        ITEM_PATHS.add(it['fullUrl'].strip('/'))
KNOWN = PAGE_SLUGS | set(COLLECTIONS) | ITEM_PATHS | {'', 'home', 'shop', 'search'}

# ---------- helpers ----------
PLACEHOLDER = re.compile(r'/(Black|Untitled-1)\.jpg$', re.I)
def img_url(u):
    if not u: return None
    u = u.strip()
    if u.startswith('//'): u = 'https:' + u
    u = u.split('?')[0]
    u = u.replace('http://', 'https://')
    return None if PLACEHOLDER.search(u) else u

FILENAMEY = re.compile(r'(\.(jpe?g|png|gif|webp|tiff?|heic)$)|(^img[_-]?\d)|(^dsc)|(^image-asset)|(_\d{2,})|(\d{6,})|(^screen ?shot)|(^untitled)', re.I)
def good_alt(alt, fallback):
    a = (alt or '').strip()
    if not a or FILENAMEY.search(a) or len(a) < 4:
        return fallback
    return a

def rewrite_href(h):
    if not h: return h
    h = h.strip()
    if h.startswith(('mailto:', 'tel:', '#')): return h
    m = re.match(r'^(?:https?:)?//(?:www\.)?penumbrafoundation\.org(/[^?#]*)?(.*)$', h)
    path = None
    if m:
        path = (m.group(1) or '/')
        rest = m.group(2) or ''
    elif h.startswith('/'):
        path, rest = re.match(r'^([^?#]*)(.*)$', h).groups()
    if path is None:
        return h  # external
    p = path.strip('/')
    if p.split('/')[0] in ('workshops', 'online-courses') and '/' in p and p not in ITEM_PATHS:
        return '/' + p.split('/')[0].replace('online-courses', 'online-learning')  # past class: live link 404s, send to the current index
    if p in KNOWN or p.split('/')[0] in ('workshops', 'online-courses', 'penumbra-store'):
        return '/' + p + (rest if rest.startswith('?') else '')
    return ORIGIN + path + rest  # not mirrored -> live site

ALLOWED = {'h1','h2','h3','h4','h5','h6','p','br','strong','b','em','i','a','ul','ol','li','blockquote','sup','sub','s','u','code','pre','hr','figure','figcaption'}
def clean(el):
    """Return sanitised inner HTML of a rich-text element."""
    el = BeautifulSoup(str(el), 'lxml')
    for s in el(['style', 'script', 'noscript', 'iframe', 'img', 'svg', 'button', 'form', 'input']):
        s.decompose()
    for t in el.find_all(True):
        if t.name not in ALLOWED:
            t.unwrap(); continue
        attrs = {}
        if t.name == 'a' and t.get('href'):
            href = rewrite_href(t['href'])
            attrs['href'] = href
            if href.startswith('http'):
                attrs['target'] = '_blank'; attrs['rel'] = 'noopener'
        t.attrs = attrs
    body = el.body or el
    out = ''.join(str(c) for c in body.contents)
    out = out.replace('\xa0', ' ')
    out = re.sub(r'<p>\s*(<br/?>)?\s*</p>', '', out)
    out = re.sub(r'(<br/>\s*){3,}', '<br/><br/>', out)
    out = re.sub(r'\s+\n', '\n', out).strip()
    return out

def text_of(h):
    t = BeautifulSoup(h or '', 'lxml').get_text(' ', strip=True)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()

# ---------- block parser ----------
def parse_block(b, ctx):
    cls = ' '.join(b.get('class', []))
    defn = (b.get('data-definition-name') or '').split('.')[-1]
    if 'html-block' in cls or 'sqs-block-html' in cls or defn == 'markdown':
        inner = b.select_one('.sqs-html-content') or b.select_one('.sqs-block-content') or b
        h = clean(inner)
        return {'t': 'text', 'html': h} if text_of(h) else None
    if defn == 'imageLayout' or 'image-block' in cls:
        img = b.select_one('img[data-src], img[data-image], img[src]')
        if not img: return None
        src = img_url(img.get('data-src') or img.get('data-image') or img.get('src'))
        if not src or 'squarespace' not in src and not src.startswith('https://'): return None
        cap_el = b.select_one('figcaption, .image-caption')
        cap = clean(cap_el) if cap_el else ''
        desc = b.select_one('[data-description]')
        if not text_of(cap) and desc:
            cap = clean(BeautifulSoup(html.unescape(desc['data-description']), 'lxml'))
        a = b.select_one('a[href]')
        href = rewrite_href(a['href']) if a and not a['href'].startswith(('https://images.', '//images.')) else None
        dims = img.get('data-image-dimensions') or ''
        w, h = (dims.split('x') + [None, None])[:2] if 'x' in dims else (None, None)
        ctx['n'] += 1
        fp = img.get('data-image-focal-point')
        return {'t': 'img', 'src': src, 'alt': good_alt(img.get('alt'), text_of(cap)[:140] or f"{ctx['title']} — image {ctx['n']}"),
                'cap': cap if text_of(cap) else '', 'w': int(w) if w and w.isdigit() else None, 'h': int(h) if h and h.isdigit() else None,
                'href': href, 'fp': fp}
    if 'gallery-block' in cls:
        imgs = []
        for img in b.select('img[data-src], img[data-image]'):
            src = img_url(img.get('data-src') or img.get('data-image'))
            if not src or any(i['src'] == src for i in imgs): continue
            anchor = img.find_parent('a')
            capt = ''
            if anchor is not None:
                capt = text_of(html.unescape(anchor.get('data-description') or '')) or (anchor.get('data-title') or '')
            dims = img.get('data-image-dimensions') or ''
            w, h = (dims.split('x') + [None, None])[:2] if 'x' in dims else (None, None)
            ctx['n'] += 1
            imgs.append({'src': src, 'alt': good_alt(img.get('alt'), capt[:140] or f"{ctx['title']} — image {ctx['n']}"),
                         'cap': capt, 'w': int(w) if w and w.isdigit() else None, 'h': int(h) if h and h.isdigit() else None})
        return {'t': 'gallery', 'imgs': imgs} if imgs else None
    if defn == 'quote':
        q = b.select_one('blockquote'); c = b.select_one('figcaption')
        return {'t': 'quote', 'text': text_of(str(q)).strip('“”"'), 'cite': text_of(str(c)) if c else ''} if q else None
    if defn == 'button':
        a = b.select_one('a[href]')
        if not a: return None
        return {'t': 'btn', 'href': rewrite_href(a['href']), 'label': a.get_text(' ', strip=True)}
    if defn == 'horizontalrule':
        return {'t': 'hr'}
    if defn == 'video':
        w = b.select_one('[data-html]')
        if w:
            m = re.search(r'src="([^"]+)"', html.unescape(w['data-html']))
            t = re.search(r'title="([^"]*)"', html.unescape(w['data-html']))
            if m:
                src = m.group(1).replace('youtube.com/embed', 'youtube-nocookie.com/embed')
                return {'t': 'video', 'src': src, 'title': t.group(1) if t else ctx['title']}
        return None
    if defn == 'accordion':
        items = []
        for li in b.select('li.accordion-item'):
            ti = li.select_one('.accordion-item__title')
            dd = li.select_one('.accordion-item__description') or li.select_one('.accordion-item__dropdown')
            items.append({'title': text_of(str(ti)) if ti else '', 'html': clean(dd) if dd else ''})
        return {'t': 'acc', 'items': items} if items else None
    if defn == 'acuity':
        w = b.select_one('.acuity-block-wrapper')
        if w:
            return {'t': 'acuity', 'owner': w.get('data-user-id'), 'calendar': w.get('data-calendar-id'),
                    'type': w.get('data-appointment-type-id')}
    if defn in ('code', 'embed'):
        raw = str(b)
        m = re.search(r'<iframe[^>]+src="([^"]+)"', html.unescape(raw))
        if m and not 'addthis' in m.group(1):
            return {'t': 'embed', 'src': m.group(1)}
        a = b.select('a[href]')
        if a:
            h = clean(b.select_one('.sqs-block-content') or b)
            return {'t': 'text', 'html': h} if text_of(h) else None
        return None
    if defn == 'product':
        p = b.select_one('[data-product]')
        if p:
            try:
                pr = json.loads(html.unescape(p['data-product']))
            except Exception:
                return None
            return {'t': 'product', 'id': pr.get('id'), 'title': pr.get('title'),
                    'price': (pr.get('fromPrice') or {}).get('value'), 'soldOut': pr.get('soldOut'),
                    'desc': clean(BeautifulSoup(pr.get('description') or '', 'lxml')),
                    'img': img_url(((pr.get('images') or [{}])[0] or {}).get('assetUrl')) if pr.get('images') else None}
    if defn == 'donation':
        return {'t': 'donate'}
    if defn == 'form' or 'newsletter' in cls:
        return {'t': 'form', 'title': ctx['title']}
    if defn == 'map':
        return {'t': 'map'}
    return None

def walk(node, ctx):
    """Walk Squarespace grid rows/cols preserving multi-column rows."""
    out = []
    for child in node.children:
        if not isinstance(child, Tag): continue
        cls = child.get('class', [])
        if 'sqs-block' in cls:
            b = parse_block(child, ctx)
            if b: out.append(b)
        elif 'row' in cls:
            cols = [c for c in child.children if isinstance(c, Tag) and 'col' in c.get('class', [])]
            if len(cols) > 1:
                parsed = []
                for c in cols:
                    span = next((int(x.split('-')[1]) for x in c.get('class', []) if x.startswith('span-')), 12)
                    bl = walk(c, ctx)
                    if bl: parsed.append({'span': span, 'blocks': bl})
                if len(parsed) > 1:
                    out.append({'t': 'row', 'cols': parsed})
                elif parsed:
                    out.extend(parsed[0]['blocks'])
            else:
                out.extend(walk(child, ctx))
        else:
            out.extend(walk(child, ctx))
    return out

def merge_text(blocks):
    res = []
    for b in blocks:
        if b['t'] == 'row':
            for c in b['cols']: c['blocks'] = merge_text(c['blocks'])
        if res and b['t'] == 'text' and res[-1]['t'] == 'text':
            res[-1]['html'] += '\n' + b['html']
        elif res and b['t'] == 'hr' and res[-1]['t'] == 'hr':
            continue
        else:
            res.append(b)
    while res and res[0]['t'] == 'hr': res.pop(0)
    while res and res[-1]['t'] == 'hr': res.pop()
    return res

def parse_layout(h, title):
    soup = BeautifulSoup(h or '', 'lxml')
    root = soup.select_one('.sqs-layout') or soup.body or soup
    ctx = {'title': title, 'n': 0}
    return merge_text(walk(root, ctx))

def first_img(blocks):
    for b in blocks:
        if b['t'] == 'img': return b['src']
        if b['t'] == 'gallery': return b['imgs'][0]['src']
        if b['t'] == 'row':
            for c in b['cols']:
                r = first_img(c['blocks'])
                if r: return r
    return None

def all_text(blocks):
    s = []
    for b in blocks:
        if b['t'] == 'text': s.append(text_of(b['html']))
        elif b['t'] == 'quote': s.append(b['text'])
        elif b['t'] == 'row':
            for c in b['cols']: s.append(all_text(c['blocks']))
        elif b['t'] == 'acc':
            s.extend(i['title'] + ' ' + text_of(i['html']) for i in b['items'])
    return ' '.join(x for x in s if x)

def first_heading(blocks):
    for b in blocks:
        if b['t'] == 'text':
            m = re.search(r'<h[1-3]>(.*?)</h[1-3]>', b['html'], re.S)
            if m: return text_of(m.group(1))
        if b['t'] == 'row':
            for c in b['cols']:
                r = first_heading(c['blocks'])
                if r: return r
    return None

def titlecase(s):
    if s and s.isupper() and len(s) > 4:
        small = {'a','an','and','the','of','in','on','for','to','with','at','by','or','x'}
        w = s.lower().split(' ')
        return ' '.join(x if (i and x in small) else x[:1].upper() + x[1:] for i, x in enumerate(w))
    return s

search = []
# ---------- pages ----------
page_index = {}
for slug in sorted(PAGE_SLUGS):
    d = ALL[slug]
    c = d.get('collection', {})
    seo = (c.get('seoData') or {})
    raw_title = (c.get('title') or '').strip()
    blocks = parse_layout(d['mainContent'], raw_title or slug)
    heading = first_heading(blocks)
    title = titlecase(raw_title if raw_title and 'Copy' not in raw_title else (heading or slug.replace('-', ' ').title()))
    if not raw_title and heading: title = titlecase(heading)
    txt = all_text(blocks)
    rec = {'slug': slug, 'title': title, 'nav': titlecase((c.get('navigationTitle') or title).strip()),
           'desc': (seo.get('seoDescription') or c.get('description') or '').strip()[:300] and text_of(seo.get('seoDescription') or c.get('description') or '')[:300],
           'img': img_url((c.get('mainImage') or {}).get('assetUrl')) or first_img(blocks),
           'updated': c.get('updatedOn'), 'blocks': blocks}
    json.dump(rec, open(f'{OUT}/pages/{slug}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    page_index[slug] = {'title': title, 'img': rec['img'], 'excerpt': txt[:220]}
    search.append({'t': title, 'u': '/' + slug, 'k': 'Page', 'x': txt[:400], 'i': rec['img']})

# ---------- collections ----------
TIER_MAP = [
    (re.compile(r'new member', re.I), 'new', 'New member + tuition'),
    (re.compile(r'professional|patron', re.I), 'pro', 'Professional / Patron member'),
    (re.compile(r'individual|student|educator|^member tuition$|member=yes', re.I), 'member', 'Member (Individual, Student, Educator)'),
    (re.compile(r'non[- ]?member|^tuition$|member=no', re.I), 'public', 'Non-member tuition'),
]
def tier_of(label):
    for rx, key, nice in TIER_MAP:
        if rx.search(label): return key, nice
    return None, label

MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'
def split_title(t):
    t = t.strip()
    name, when = t, ''
    m = re.match(r'^(.*?):\s*((?:Mondays|Tuesdays|Wednesdays|Thursdays|Fridays|Saturdays|Sundays|Weekends)?,?\s*(?:%s).*)$' % MONTHS, t)
    if m: name, when = m.group(1).strip(), m.group(2).strip()
    inst = ''
    m2 = re.match(r'^(.*?)\s+with\s+(.+)$', name)
    if m2: inst = m2.group(2).strip(); name = m2.group(1).strip()
    return name, inst, when

def facts(body_txt):
    f = {}
    m = re.search(r'Class Size(?: Max)?:?\s*(\d+)(?:\s*Max)?', body_txt, re.I)
    if m: f['size'] = int(m.group(1))
    m = re.search(r'(\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)(?:\s*(?:EST|ET|EDT))?)', body_txt, re.I)
    if m: f['time'] = m.group(1).upper().replace('–', '-')
    m = re.search(r'includes? an? \$?(\d+) materials fee', body_txt, re.I)
    if m: f['materials'] = int(m.group(1))
    m = re.search(r'Prerequisites?:\s*([^.]+\.)', body_txt, re.I)
    if m: f['prereq'] = m.group(1).strip()
    m = re.search(r'\b(Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?)(?:\s*(?:&|and)\s*(Saturdays?|Sundays?))?\b', body_txt)
    if m: f['days'] = m.group(0)
    return f

LOGI = re.compile(r'^(((Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days?)(\s*(&|and|,)\s*((Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days?))*\s*$|(%s)\s+\d|\d{1,2}(:\d\d)?\s*(AM|PM)|Class Size|Prerequisites?:|If your desired tuition|Curious about Membership|Tuition includes)' % MONTHS, re.I)
def strip_logistics(blocks):
    """Logistics move into the visit rail; drop their duplicate lines from the body."""
    out = []
    for b in blocks:
        if b['t'] == 'text':
            s = BeautifulSoup(b['html'], 'lxml')
            for p in s.find_all('p'):
                if LOGI.match(p.get_text(' ', strip=True)):
                    p.decompose()
            h = ''.join(str(c) for c in (s.body.contents if s.body else []))
            if text_of(h): out.append({'t': 'text', 'html': h})
        else:
            out.append(b)
    return out

LEVELS = {'Beginner', 'Intermediate', 'Advanced', 'All Levels'}
NOISE = {'Workshops', 'Flash Sale', 'Thanksgiving Promo', 'Fall Promo', 'Online Courses', 'One-Day Workshops'}
coll_out = {}
for col in COLLECTIONS:
    d = ALL.get(col)
    if not d: continue
    items = []
    for idx, it in enumerate(d['items']):
        path = it['fullUrl'].strip('/')
        det = ALL.get(path.replace('/', '__'), {}).get('item') or it
        body_blocks = parse_layout(det.get('body') or '', it['title'])
        body_txt = all_text(body_blocks)
        if col in ('workshops', 'online-courses'):
            body_blocks = strip_logistics(body_blocks)
        imgs = []
        for sub in (det.get('items') or []):
            u = img_url(sub.get('assetUrl'))
            if u and u not in [i['src'] for i in imgs]:
                fp = sub.get('mediaFocalPoint') or {}
                imgs.append({'src': u, 'alt': good_alt(sub.get('title'), f"{it['title']} — image {len(imgs)+1}"),
                             'fp': f"{fp.get('x',.5)},{fp.get('y',.5)}", 'size': sub.get('originalSize')})
        main = img_url(it.get('assetUrl'))
        if main and main not in [i['src'] for i in imgs]:
            fp = it.get('mediaFocalPoint') or {}
            imgs.insert(0, {'src': main, 'alt': it['title'], 'fp': f"{fp.get('x',.5)},{fp.get('y',.5)}", 'size': it.get('originalSize')})
        variants = []
        for v in (det.get('variants') or it.get('variants') or []):
            label = ' / '.join(str(x) for x in (v.get('attributes') or {}).values()) or 'Standard'
            key, nice = tier_of(' '.join(f"{k}={val}" for k, val in (v.get('attributes') or {}).items()) if 'Member' in (v.get('attributes') or {}) else label)
            price = float((v.get('priceMoney') or {}).get('value') or 0)
            sale = float((v.get('salePriceMoney') or {}).get('value') or 0)
            instock = bool(v.get('unlimited')) or (v.get('qtyInStock') or 0) > 0
            variants.append({'id': v.get('id'), 'label': label, 'tier': key if col in ('workshops', 'online-courses') else None,
                             'tierLabel': nice if col in ('workshops', 'online-courses') else label,
                             'price': price, 'sale': sale if v.get('onSale') else None, 'inStock': instock})
        sold_out = bool(variants) and not any(v['inStock'] for v in variants)
        prices = [v['sale'] or v['price'] for v in variants if (v['sale'] or v['price'])]
        cats = it.get('categories') or []
        name, inst, when = split_title(it['title']) if col in ('workshops', 'online-courses') else (it['title'], '', '')
        sub = None
        if it.get('isSubscribable') or 'every' in (text_of(det.get('body')) or ''):
            sub = True
        rec = {
            'slug': it['urlId'], 'path': '/' + path, 'col': col, 'title': it['title'].strip(), 'name': titlecase(name), 'instructor': inst, 'when': when,
            'cats': [c for c in cats if c not in NOISE], 'level': next((c for c in cats if c in LEVELS), None),
            'tags': it.get('tags') or [], 'img': imgs[0]['src'] if imgs else None, 'fp': imgs[0]['fp'] if imgs else '0.5,0.5',
            'imgs': imgs, 'excerpt': text_of(it.get('excerpt'))[:300], 'variants': variants, 'soldOut': sold_out,
            'from': min(prices) if prices else 0, 'to': max(prices) if prices else 0,
            'facts': facts(body_txt) if col in ('workshops', 'online-courses') else {},
            'order': idx, 'added': it.get('addedOn'), 'button': it.get('customAddButtonText') if it.get('useCustomAddButtonText') else None,
            'subscription': bool(it.get('isSubscribable')),
        }
        detail = dict(rec); detail['blocks'] = body_blocks
        json.dump(detail, open(f"{OUT}/items/{path.replace('/', '__')}.json", 'w'), ensure_ascii=False, separators=(',', ':'))
        items.append(rec)
        kind = {'workshops': 'Workshop', 'online-courses': 'Online class'}.get(col, 'Shop')
        search.append({'t': rec['title'], 'u': rec['path'], 'k': kind, 'x': (rec['excerpt'] + ' ' + body_txt)[:400], 'i': rec['img']})
    coll_out[col] = items
    intro = clean(BeautifulSoup(d['collection'].get('description') or '', 'lxml'))
    intro = re.sub(r'^\s*<p><strong>[^<]{0,40}</strong></p>', '', intro).strip()
    json.dump({'title': d['collection'].get('title'), 'intro': intro, 'items': items}, open(f'{OUT}/{col}.json', 'w'), ensure_ascii=False, separators=(',', ':'))

# ---------- home ----------
slides = []
for it in ALL['home']['items']:
    blocks = parse_layout('<div class="sqs-layout"><div class="sqs-block html-block"><div class="sqs-html-content">' + (it.get('body') or '') + '</div></div></div>', it['title'])
    h = blocks[0]['html'] if blocks else ''
    links = re.findall(r'<a href="([^"]+)"[^>]*>(.*?)</a>', h)
    fp = it.get('mediaFocalPoint') or {}
    credit = re.search(r'Image ©[^<]+', h)
    slides.append({'title': re.sub(r'\s+', ' ', it['title']).strip(), 'img': img_url(it.get('assetUrl')), 'fp': f"{fp.get('x',.5)},{fp.get('y',.5)}",
                   'size': it.get('originalSize'), 'html': h, 'links': [{'href': a, 'label': text_of(b)} for a, b in links],
                   'credit': credit.group(0).strip() if credit else ''})
json.dump({'slides': slides, 'pages': {k: page_index[k] for k in page_index}}, open(f'{OUT}/home.json', 'w'), ensure_ascii=False, separators=(',', ':'))

json.dump(search, open(f'{OUT}/search.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('pages', len(PAGE_SLUGS), 'search', len(search), {k: len(v) for k, v in coll_out.items()})
