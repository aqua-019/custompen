# SP-01 · CUSTOMPEN — Penumbra Foundation redesign

STAMP :: D700 · 4 Oct 2026 · 6511 entries D0001-D6558, D4000 deliberately skipped · 218 laws · 387 capsules · 466 groups · 1824 pairs · 499 anti-pairs · 457 palettes · 21 lenses

## INTAKE (§0C step 1) — answers and defaults taken

- (a) SURFACES: home (Brand/Orient/Navigate/Convert) · workshops index (Navigate/Inform/Convert) · workshop detail (Inform/Convert/Trust) · shop index + product (Convert/Inform) · cart (Convert/Feedback) · membership (Convert/Inform) · tintype booking (Convert/Orient) · archive page, the generic renderer for ~270 pages (Inform/Trust) · search (Navigate) · 404 (Orient).
- (b) REGISTER: `archive · editorial · institution`, which the intent index maps to the recipe "Editorial archive / institutional site (CUSTOMPEN-class)" + MK-01. The commerce surfaces borrow `commerce · calm`, which maps to TP04 (The Calm Commerce Front).
- (c) MOTION BUDGET: default taken. MK-01 (Calm & editorial). Zero PERF=H. D3453 (Reduced-motion as a hard gate) acts as a construction gate. View transitions are licensed by the recipe's "except transitions" clause and run on the same house curve.
- (d) COLOUR: PAL Selenium Editorial (the catalogue names it for CUSTOMPEN) with CPAIR-03 role assignments.
- (e) CHAIN/TRUST: none (no BTC/XMR/LTC surface).
- (f) PROJECT STATE: existing estate (penumbrafoundation.org, Squarespace 7.0). Content is carried over 1:1 from the crawl of 2 Nov 2026. The composition is new, so a full SP rather than a §0D delta.
- (g) CONSTRAINTS: CPLX ≤ 3 · A11Y floor WCAG 2.2 AA · ERA Timeless (+ Emerging for transitions) · stack: React 19 + Vite static SPA on Vercel.
- (h) WHAT EXISTS: all copy, images (Squarespace CDN), prices, tiers, and the Acuity + Donorbox embeds come from the live site.

SP-01 :: CUSTOMPEN :: SURFACES=home, workshops, workshop-detail, shop, product, cart, membership, tintype, page, search, 404 :: CITES=TP05 (The Research Register) · TP04 (The Calm Commerce Front) · DY10 (The credible institution) · DY01 (Calm interface) · DY07 (Commerce confidence) · GA10 (Editorial authority) · GX04 (The measure lock) · GP05 (The quiet catalogue) · PAL Selenium Editorial · CPAIR-03 · MK-01 · recipe "Editorial archive / institutional site (CUSTOMPEN-class)" · governing LAW-02, LAW-05, LAW-06, LAW-16, LAW-31, PALRULE-02, PALRULE-03 · NOPAIR-02, NOPAIR-237, NOPAIR-322 resolved :: FLOOR=3 DY/2 TP + 3 G/7 pairs/1 PAL/0 unresolved nopair/20 asserts

## Composition

- FOUNDATION: D3003 (Near-black ink, never black) on the Selenium ground #141210, with D4268 (Dark level ladder tokens) for the surface steps · D3006 (Alpha-tint border tokens) / D4198 (Alpha line tokens) for every hairline · D3171 (No-transform hover discipline) + D3052 (Colour-only hover transitions). LAW-02 hover verb = RECOLOUR.
- TYPE: GA10 (Editorial authority). D3016 (Serif body, sans headings): Newsreader (opsz 6–72) carries titles and reading, Instrument Sans carries hierarchy (kickers, nav, UI labels), and JetBrains Mono carries dates and prices with D0142 (Tabular numerals) + D3017 (Proportional lining numerals globally) in prose. GX04 (The measure lock): D3032 (Hard measure cap) at 640px, D3022 (Balanced headline wrapping), D3023 (Pretty body wrapping), D3034 (Wide container, narrow content). D1330 (initial-letter drop caps) opens archive articles.
- INSTITUTION (CAT=71): D5298 (Ticket pill as sole header colour) — the membership pill is the header's only chroma · D5737 (Menu-word collapse with persistent till) on narrow viewports · D5712 (Query-key collection browser) + D6194 (Filter-state document title) + D5742 (Holdings count as lede) on the workshop index · D5734 (Date-and-category rule line) on cards · D5302 (Dot-flanked status chip) for availability · D5729 (Exhibition visit rail) on exhibitions and workshops · D5295 (Native-ratio artwork thumbnails) in the shop · D6179 (Ink-tint ratio placeholder) for image loading · D6185 (Photo-headed institutional 404) + D0865 (Friendly 404 page).
- COMMERCE: DY07 (Commerce confidence) — D3465 (Invisible-link plus real-button pair) on cards, D3471 (Sticky-column configurator) on workshop and product detail (gallery scrolls, tuition column sticks), D3429 (Native dialog commerce prompt) for the cart and lightbox. GP05 (The quiet catalogue) caps the feedback amplitude.
- MEDIA: D2212 (Focal-point cropping) uses Squarespace's stored focal points · D3403 (Symmetric figure bleed) for single figures in archive prose · D0893 (Image fallback chain).
- MOTION: MK-01 (Calm & editorial). One easing voice, out-quart cubic-bezier(.165,.84,.44,1) (D3051 (Four named easing tokens), D3670 (Ease-out default law)). Hover 0.2s colour only; house durations .344s / .414s (D3468 (Non-round house durations)). D0701 (View Transitions API (same-doc)) crossfades route changes on the same curve. D3405 (Zero-motion research surface) holds on archive pages.
- SIGNATURE SET-PIECE (one, home only): "the contact sheet". The seven homepage stories render as a static, numbered 35 mm contact sheet (sprocket rails, edge-print frame numbers) in place of the autoplay carousel. It uses CSS only and zero motion.

## PAIRs honoured
- PAIR-01 :: D3022 (Balanced headline wrapping) + D3032 (Hard measure cap)
- PAIR-109 :: D3670 (Ease-out default law) + D3051 (Four named easing tokens)
- PAIR-356 :: D4198 (Alpha line tokens) + D3003 (Near-black ink, never black)
- PAIR-357 :: D4197 (Weight-paired type scale) + D0142 (Tabular numerals)
- PAIR-392 :: D4268 (Dark level ladder tokens) + D3003 (Near-black ink, never black)
- PAIR-528 :: D4526 (Underline-only link hover) + D3404 (Dimming ink links)
- PAIR-530 :: D4529 (Reduced-motion kills view transitions) + D3453 (Reduced-motion as a hard gate)

## NOPAIR sweep (cited set) — 0 unresolved
- NOPAIR-02 D3455 × D3171 → resolved: D3455 (Pixel-constant hover swell) dropped, D3171 adopted estate-wide (MK-01 lists both and the surface takes one).
- NOPAIR-237 D5295 × D2193 → resolved: native ratio on artworks (shop, galleries), with the ratio lock only on workshop venue photography and never on the same image.
- NOPAIR-322 D5737 × D0202 → resolved: the header never auto-hides.
- NOPAIR-162 D4910 × D3405 → not triggered (no keyframe namespace).
- D3425 (Commerce view() reveals) is deliberately not composed: it is an MK-02 member and would add a second motion kit.

## ASSERTs
ASSERT :: all :: --bg = #141210 :: PER=PAL Selenium Editorial
ASSERT :: all :: body color = #ede6d8 :: PER=PAL Selenium Editorial
ASSERT :: all :: --surface = #1f1b16 :: PER=PAL Selenium Editorial · D4268 (Dark level ladder tokens)
ASSERT :: all :: accent (#e0c070 / #c8a04b) appears only on primary action, active/selected state, and links :: PER=PALRULE-02 · CPAIR-03
ASSERT :: all :: :focus-visible outline = 2px solid #7fa7ff (outside the palette) :: PER=LAW-06 · PALRULE-03
ASSERT :: all :: hover transform delta = 0 and box-shadow delta = 0 on every interactive element :: PER=D3171 (No-transform hover discipline) · LAW-02
ASSERT :: all :: hover transitions animate color/background-color/border-color at 0.2s :: PER=D3052 (Colour-only hover transitions)
ASSERT :: all :: every transition-timing-function = cubic-bezier(0.165, 0.84, 0.44, 1) :: PER=LAW-16 · D3051 (Four named easing tokens)
ASSERT :: all :: under prefers-reduced-motion every transition and ::view-transition animation duration = 0s :: PER=D3453 (Reduced-motion as a hard gate) · D4529 (Reduced-motion kills view transitions)
ASSERT :: page :: prose column max-width = 640px :: PER=D3032 (Hard measure cap)
ASSERT :: all :: h1–h3 text-wrap = balance; p text-wrap = pretty :: PER=D3022 (Balanced headline wrapping) · D3023 (Pretty body wrapping)
ASSERT :: all :: prices and dates font-variant-numeric includes tabular-nums :: PER=D0142 (Tabular numerals)
ASSERT :: header :: the only chromatic fill in the header is the membership pill :: PER=D5298 (Ticket pill as sole header colour)
ASSERT :: header :: position = sticky, never hidden on scroll; < 1024px nav collapses to the word "Menu" while cart stays visible :: PER=D5737 (Menu-word collapse with persistent till) · NOPAIR-322
ASSERT :: workshops :: every filter is a URL query key (technique, format, month, open) and document.title lists active filters :: PER=D5712 (Query-key collection browser) · D6194 (Filter-state document title)
ASSERT :: workshops :: a holdings count ("N workshops") precedes the filters :: PER=D5742 (Holdings count as lede)
ASSERT :: workshop-detail :: all tuition tiers render with price and availability before any selection :: PER=D3471 (Sticky-column configurator) · audit M06
ASSERT :: shop :: product thumbnails use aspect-ratio auto (native ratio), sold-out hidden by default :: PER=D5295 (Native-ratio artwork thumbnails) · audit M07
ASSERT :: cart :: the cart is a native <dialog> opened with showModal() :: PER=D3429 (Native dialog commerce prompt)
ASSERT :: all :: no <img> ships an empty or filename alt :: PER=audit M04 (accessibility)
ASSERT :: 404 :: photo-headed page with search field and popular links :: PER=D6185 (Photo-headed institutional 404) · D0865 (Friendly 404 page)

MEASURE ::
