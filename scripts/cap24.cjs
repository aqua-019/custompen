// CAP-24 · SP-Verify probe diff for SP-01 CUSTOMPEN. Usage: node cap24.cjs <baseURL>
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:4173';
const V = []; const say = (a, ok, measured) => V.push(`${ok === null ? 'UNMEASURABLE' : ok ? 'VERIFIED' : 'FAILED'} :: ${a}${measured !== undefined ? ' :: measured=' + measured : ''}`);
(async () => {
  const b = await chromium.launch({ args: process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] : [] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  const tok = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); const bs = getComputedStyle(document.body); return { bg: bs.backgroundColor, ink: bs.color, surface: cs.getPropertyValue('--surface').trim(), ease: cs.getPropertyValue('--ease').trim() } });
  say('all :: --bg = #141210', tok.bg === 'rgb(20, 18, 16)', tok.bg);
  say('all :: body color = #ede6d8', tok.ink === 'rgb(237, 230, 216)', tok.ink);
  say('all :: --surface = #1f1b16', tok.surface.toLowerCase() === '#1f1b16', tok.surface);
  // hover census: transform / shadow deltas and transition props
  const census = await p.evaluate(() => {
    const els = [...document.querySelectorAll('a, button, .tag, .pill, .btn')].filter(e => e.offsetParent).slice(0, 60);
    const tf = new Set(), props = new Set(), dur = new Set();
    for (const e of els) { const s = getComputedStyle(e); (s.transitionTimingFunction.match(/cubic-bezier\([^)]*\)|steps\([^)]*\)|[a-z-]+/g) || []).forEach(x => x !== 'ease' && tf.add(x)); s.transitionProperty.split(',').forEach(x => props.add(x.trim())); s.transitionDuration.split(',').forEach(x => dur.add(x.trim())) }
    return { tf: [...tf], props: [...props], dur: [...dur], n: els.length };
  });
  const hov = [];
  for (const sel of ['.btn', '.pill', '.hdr__link', '.frame__t a', '.wcard__t a', '.arrow', '.rung']) {
    const loc = p.locator(sel + ':visible').first(); if (!(await loc.count())) continue;
    const el = await loc.elementHandle();
    await el.scrollIntoViewIfNeeded();
    const before = await el.evaluate(e => { const s = getComputedStyle(e); return [s.transform, s.boxShadow, s.color, s.backgroundColor] });
    await el.hover(); await p.waitForTimeout(350);
    const after = await el.evaluate(e => { const s = getComputedStyle(e); return [s.transform, s.boxShadow, s.color, s.backgroundColor] });
    hov.push({ sel, transform: before[0] !== after[0], shadow: before[1] !== after[1], colour: before[2] !== after[2] || before[3] !== after[3] });
    await p.mouse.move(0, 0);
  }
  const tDelta = hov.filter(h => h.transform || h.shadow);
  say('all :: hover transform delta = 0 and box-shadow delta = 0', tDelta.length === 0, `${hov.length} probed, ${tDelta.length} moved, ${hov.filter(h => h.colour).length} recoloured`);
  say('all :: hover transitions animate colour properties only', census.props.every(x => /color|background|border|opacity|text-decoration|all|^none$/.test(x)) && !census.props.some(x => /transform|box-shadow/.test(x)), census.props.join('|'));
  const tfs = census.tf.filter(x => x !== 'ease');
  say('all :: every transition-timing-function = cubic-bezier(0.165, 0.84, 0.44, 1)', tfs.every(x => x === 'cubic-bezier(0.165, 0.84, 0.44, 1)'), tfs.join('|') + ` dur=${census.dur.join('|')}`);
  // focus ring
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  const focus = await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` });
  say('all :: :focus-visible outline = 2px solid #7fa7ff', /solid 2px rgb\(127, 167, 255\)/.test(focus), focus);
  // wrap
  const wrap = await p.evaluate(() => ({ h: getComputedStyle(document.querySelector('h1,h2')).textWrap || getComputedStyle(document.querySelector('h1,h2')).textWrapStyle, p: getComputedStyle(document.querySelector('p')).textWrap || getComputedStyle(document.querySelector('p')).textWrapStyle }));
  say('all :: h1–h3 text-wrap = balance; p = pretty', /balance/.test(wrap.h) && /pretty/.test(wrap.p), JSON.stringify(wrap));
  const nums = await p.evaluate(() => [...document.querySelectorAll('.price, .mono')].slice(0, 30).every(e => /tabular-nums/.test(getComputedStyle(e).fontVariantNumeric)));
  say('all :: prices/dates font-variant-numeric tabular-nums', nums);
  // header chroma
  const hdr = await p.evaluate(() => { const out = []; document.querySelectorAll('.hdr__bar *').forEach(e => { const c = getComputedStyle(e).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && !/rgb\((20, 18, 16)\)/.test(c)) out.push((e.className || e.tagName).toString().slice(0, 20) + ':' + c) }); return out });
  say('header :: only chromatic fill is the membership pill', hdr.length === 1 && hdr[0].startsWith('pill'), hdr.join(' | '));
  await p.evaluate(() => window.scrollTo(0, 3000)); await p.waitForTimeout(300);
  const sticky = await p.evaluate(() => { const h = document.querySelector('.hdr'); const r = h.getBoundingClientRect(); return getComputedStyle(h).position + ' top=' + Math.round(r.top) });
  say('header :: sticky, never hidden on scroll', sticky === 'sticky top=0', sticky);
  // alt census across surfaces
  let bad = 0, total = 0;
  for (const path of ['/', '/workshops', '/penumbra-store', '/membership-main', '/upcoming-exhibitions', '/workshops/lumen-printing']) {
    await p.goto(base + path, { waitUntil: 'networkidle' });
    const r = await p.$$eval('img', is => is.map(i => i.closest('a[aria-label], [aria-hidden="true"]') ? 'ok' : i.alt));
    total += r.length; bad += r.filter(a => a !== 'ok' && (!a || /\.(jpe?g|png|webp)$/i.test(a))).length;
  }
  say('all :: no <img> ships empty or filename alt (decorative imgs inside labelled links excepted)', bad === 0, `${bad}/${total}`);
  // measure cap
  await p.goto(base + '/about', { waitUntil: 'networkidle' });
  const mw = await p.evaluate(() => getComputedStyle(document.querySelector('.prose')).maxWidth);
  say('page :: prose column max-width = 640px', mw === '640px', mw);
  // workshops
  await p.goto(base + '/workshops?technique=Wet+Plate', { waitUntil: 'networkidle' });
  const wt = await p.title(); const lede = await p.evaluate(() => { const c = document.querySelector('.idx-hd__count'); const f = document.querySelector('.filters'); return !!c && !!f && (c.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 });
  say('workshops :: filters are URL keys and document.title lists them', wt.startsWith('Workshops: Wet Plate'), wt);
  say('workshops :: holdings count precedes the filters', lede);
  await p.goto(base + '/workshops/intro-platinum-weekend', { waitUntil: 'networkidle' });
  const tiers = await p.$$eval('.tier', ts => ts.map(t => t.innerText.replace(/\s+/g, ' ')));
  say('workshop-detail :: all tuition tiers render with price + availability before selection', tiers.length === 4 && tiers.every(t => /\$\d/.test(t) && /(OPEN|FULL)/i.test(t)), tiers.length + ' tiers');
  await p.goto(base + '/penumbra-store', { waitUntil: 'networkidle' });
  const shop = await p.evaluate(() => ({ ar: getComputedStyle(document.querySelector('.pcard .img')).aspectRatio, sold: document.querySelectorAll('.pcard.is-soldout').length }));
  say('shop :: native ratio thumbnails, sold-out hidden by default', shop.sold === 0 && !/^4 \/ 3$/.test(shop.ar), JSON.stringify(shop));
  await p.goto(base + '/workshops/lumen-printing', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /^Register/ }).click(); await p.waitForTimeout(400);
  const modal = await p.evaluate(() => { const d = document.querySelector('dialog.sheet'); return d.tagName + ' open=' + d.open + ' modal=' + d.matches(':modal') });
  say('cart :: native <dialog> via showModal()', /DIALOG open=true modal=true/.test(modal), modal);
  await p.goto(base + '/no-such-page-here', { waitUntil: 'networkidle' });
  const nf = await p.evaluate(() => !!document.querySelector('.nf__fig img, .nf__fig .img-plate') && !!document.querySelector('.nf__q input') && document.querySelectorAll('.nf__links a').length >= 5);
  say('404 :: photo-headed with search + popular links', nf);
  await ctx.close();
  // reduced motion
  const rctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', ignoreHTTPSErrors: true });
  const r = await rctx.newPage(); await r.goto(base + '/', { waitUntil: 'networkidle' });
  const rm = await r.evaluate(() => { const d = new Set(); document.querySelectorAll('*').forEach(e => getComputedStyle(e).transitionDuration.split(',').forEach(x => d.add(x.trim()))); return [...d] });
  say('all :: reduced motion → every transition-duration = 0s', rm.every(x => x === '0s'), rm.join('|'));
  console.log(V.join('\n'));
  console.log(`\nCAP-24 ${V.filter(v => v.startsWith('VERIFIED')).length}/${V.length} VERIFIED · failed=${V.filter(v => v.startsWith('FAILED')).length}`);
  await b.close();
  process.exit(V.filter(v => v.startsWith('FAILED')).length);
})();
