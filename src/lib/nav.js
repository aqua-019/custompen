// Information architecture — five groups instead of six folders + 35 links.
// Every destination is a page that exists on penumbrafoundation.org today (2 Nov 2026).
export const NAV = [
  {
    label: 'Learn',
    blurb: 'Over 100 workshops a year in darkroom, alternative process, wet plate, digital and the photobook.',
    feature: { slug: 'workshops', label: 'In-person workshops', href: '/workshops' },
    items: [
      { label: 'In-person workshops', href: '/workshops' },
      { label: 'Online learning', href: '/online-learning' },
      { label: 'Mini Series', href: '/mini-series' },
      { label: 'Long Term Program: The Photobook', href: 'https://photobooksatpenumbrafoundation.org/long-term-photobook-program', ext: true },
      { label: 'Post/Keller Scholarship Program', href: '/postkeller-scholarship-program' },
      { label: 'School Tours', href: '/school-tours' },
      { label: 'Education policies', href: '/policies' },
      { label: 'FAQs', href: '/education-faqs' },
    ],
  },
  {
    label: 'Exhibitions',
    blurb: 'Two galleries on East 30th Street: the Exhibition Space and the Project Space reading room.',
    feature: { slide: 0, label: 'Now on view', href: '/upcoming-exhibitions' },
    items: [
      { label: 'Exhibition Space — now on view', href: '/upcoming-exhibitions' },
      { label: 'Project Space', href: '/project-gallery-current' },
      { label: 'In the Fold 2026', href: '/exhibition-space-in-the-fold-2026' },
      { label: 'Members Gallery 2025', href: '/members-gallery-2025' },
      { label: 'Past exhibitions — Exhibition Space', href: '/previous-exhibition-space' },
      { label: 'Past exhibitions — Project Gallery', href: '/past-exhibitions-project-space' },
    ],
  },
  {
    label: 'Programs',
    blurb: 'Lectures, residencies, internships and the photobook forum.',
    feature: { slide: 1, label: 'Artist Series Fall 2026', href: '/artist-series-fall-2026' },
    items: [
      { label: 'Artist Series Fall 2026', href: '/artist-series-fall-2026' },
      { label: 'In The Fold: Photobook Forum 2026', href: '/in-the-fold-photobook-forum-2026' },
      { label: '2026 Workspace Residency', href: '/workspace' },
      { label: 'Apply to the residencies', href: '/how-to-apply' },
      { label: 'Risograph Photobook Award', href: 'https://photobooksatpenumbrafoundation.org/risograph-publication-award-2026', ext: true },
      { label: '2026 Risograph Residents', href: 'https://photobooksatpenumbrafoundation.org/residents-2026', ext: true },
      { label: 'Digitization Internship Program', href: '/penumbra-foundation-digitization-internship-program' },
      { label: 'Photogravure Portfolio Opportunity', href: '/photogravure-portfolio-opportunity' },
      { label: 'Artist Series archive', href: '/artist-series' },
    ],
  },
  {
    label: 'Tintype',
    blurb: 'A wet plate collodion portrait studio. 8×10 plates, one weekend a month at Highlight Studios.',
    feature: { slide: 5, label: 'Book a portrait session', href: '/book-session' },
    items: [
      { label: 'Book a session', href: '/book-session' },
      { label: 'Tintype services', href: '/tintype-services' },
      { label: 'FAQ & policies', href: '/tintype-faq' },
      { label: 'Tintype scans', href: '/tintype-1/scan' },
    ],
  },
  {
    label: 'Visit',
    blurb: '36 East 30th Street, between Madison and Park. Gallery hours Monday–Friday, 2–6pm.',
    feature: { slide: 6, label: 'Highlight Studios', href: '/highlight-studios' },
    items: [
      { label: 'Visit us', href: '/visitus' },
      { label: 'About Penumbra', href: '/about' },
      { label: 'Facility rentals', href: '/facility-rentals' },
      { label: 'Highlight Studios', href: '/highlight-studios' },
      { label: 'Library', href: '/library_program' },
      { label: 'Donate', href: '/donate' },
      { label: 'Newsletter', href: '/subscribe' },
    ],
  },
]

export const SHOP_LINKS = [
  { label: 'Shop all', href: '/penumbra-store' },
  { label: '2026 Gift Guide', href: '/2026-gift-guide' },
  { label: 'Gift a membership', href: '/penumbra-store/membership' },
  { label: 'Gift certificate', href: '/penumbra-store/gift-certificate' },
]

export function sectionOf(path) {
  const p = path.replace(/\/$/, '') || '/'
  for (const g of NAV) if (g.items.some((i) => i.href === p)) return g.label
  if (/^\/(workshops|online-courses)/.test(p)) return 'Learn'
  if (/^\/(penumbra-store|new-products-2|digital-negatives-1|tintype-1)/.test(p)) return 'Shop'
  if (/members-gallery|exhibition|project-(gallery|space)|home-/.test(p)) return 'Exhibitions'
  if (/membership/.test(p)) return 'Membership'
  if (/residen|artist-series|lecture|internship|in-the-fold/.test(p)) return 'Programs'
  if (/rental|darkroom|scanner|printer|imacon|risograph-machine|digitization|studio/.test(p)) return 'Facilities'
  return 'Penumbra Foundation'
}

export const LOGO = 'https://images.squarespace-cdn.com/content/v1/55d61c1be4b0cafd401171f5/1587497218366-BXK83RP5JPDWZ43KLHZ5/PF_EYE_LOGO_WHT_2020.png'

export const SUPPORTERS = [
  'Phillip and Edith Leonian Foundation',
  'Jacques and Natasha Gelman Foundation',
  'Lawrence Foundation',
  'Ruth Arts',
  'New York City Department of Cultural Affairs',
  'New York State Council on the Arts',
  'Joy of Giving Something Inc.',
]
