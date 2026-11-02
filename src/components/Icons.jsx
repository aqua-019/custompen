const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
export const SearchIcon = () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>);
export const BagIcon = () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>);
export const MenuIcon = () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><path d="M4 8h16M4 16h16" /></svg>);
export const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><path d="m6 6 12 12M18 6 6 18" /></svg>);
export const ArrowL = () => (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...P}><path d="M15 6l-6 6 6 6" /></svg>);
export const ArrowR = () => (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...P}><path d="M9 6l6 6-6 6" /></svg>);
/* half-lit disc: the penumbra itself, used for the Darkroom / Paper switch */
export const PenumbraIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M12 3.75a8.25 8.25 0 0 1 0 16.5Z" fill="currentColor" /></svg>
);
