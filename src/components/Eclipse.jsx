import { useId } from "react";
import { RAYS, RING_INNER } from "../lib/eclipse-path";

/* Penumbra's eclipse mark as a vector: rays + ring, the umbra cut out so any ground shows through. */
export default function Eclipse({ size = 30, label, className }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className}
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <mask id={`m${id}`}>
        <rect width="100" height="100" fill="#fff" />
        <circle cx="50" cy="50" r={RING_INNER} fill="#000" />
      </mask>
      <g mask={`url(#m${id})`} fill="currentColor">
        <path d={RAYS} />
        <circle cx="50" cy="50" r="27" />
      </g>
    </svg>
  );
}
