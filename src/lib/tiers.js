// Transcribed from the seven tier pages on penumbrafoundation.org (read 2 Nov 2026).
// The live site makes you open each page to learn the price; here they sit side by side.
export const TIERS = [
  {
    id: 'student', name: 'Student', price: 35, href: '/student-membership',
    line: 'For students at accredited academic or arts institutions — Open Studios, discounted film processing, and every Individual benefit.',
    note: 'Proof of student ID required.',
  },
  {
    id: 'educator', name: 'Educator', price: 35, href: '/educator-membership',
    line: 'For anyone employed by an accredited academic or arts institution — every Individual benefit at a reduced rate.',
    note: 'Employment at an accredited or approved institution required.',
  },
  {
    id: 'individual', name: 'Individual', price: 75, href: '/individual-membership',
    line: 'Join a growing community of artists and creatives: workshop discounts, member events, open calls and facility access.',
  },
  {
    id: 'dual', name: 'Dual', price: 100, href: '/dual-membership',
    line: 'Sign up with a friend. Every Individual benefit, for two people.',
  },
  {
    id: 'professional', name: 'Professional', price: 350, href: '/pf-membership',
    line: 'Premium perks: 20% off workshops and online classes, and a complimentary 8×10 tintype session.',
  },
  {
    id: 'prostudio', name: 'Pro Studio', price: 550, href: '/pro-studio-membership',
    line: 'For commercial and studio photographers: 50% off your first Highlight Studios rental, 25% off every rental after.',
  },
  {
    id: 'patron', name: 'Patron', price: 1000, href: '/patron-membership',
    line: 'Support Penumbra at the highest level, with invitations to Advisory and Executive Board programs with artists and curators.',
  },
]

const Y = '●'
// rows: [label, student, educator, individual, dual, professional, prostudio, patron]
export const MATRIX = [
  ['Workshops & online classes', '15%', '15%', '15%', '15%', '20%', '15%', '20%'],
  ['Tintype portrait sessions', '15%', '15%', '15%', '15%', '20%', '15%', '15%'],
  ['Highlight Studios rentals', '15%', '15%', '15%', '15%', '15%', '50% first · 25% after', '50% first · 25% after'],
  ['Film processing at LTI Lightside', '20%', '15%', '10%', '10%', '20%', '20%', '20%'],
  ['Free 8×10 tintype session or gift card', '', '', '', '', Y, '', Y],
  ['Open Studios (Student & Educator)', Y, Y, '', '', Y, '', ''],
  ['Board programs with artists & curators', '', '', '', '', '', '', Y],
  ['Covers two people', '', '', '', Y, '', '', ''],
  ['Facility rentals: darkrooms, Risograph, scanners, Imacon, GFX', Y, Y, Y, Y, Y, Y, Y],
  ['Library of early photography books', Y, Y, Y, Y, Y, Y, Y],
  ['Members Online Gallery submissions', Y, Y, Y, Y, Y, Y, Y],
  ['Member events — studio visits, gallery tours', Y, Y, Y, Y, Y, Y, Y],
  ['Partner benefits — Printed Matter, Filter Photo, SPE, WOPHA', Y, Y, Y, Y, Y, Y, Y],
]
