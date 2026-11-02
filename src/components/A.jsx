import { Link } from "react-router";

/* One link primitive: internal routes crossfade (D3859 / view transitions), externals open
   in a new tab and say so. */
export const isExternal = (href = "") => /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

export default function A({ href, to, children, className, external, ...rest }) {
  const target = href ?? to ?? "/";
  if (external || isExternal(target)) {
    const web = /^https?:/.test(target);
    return (
      <a href={target} className={className} {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
        {web && <span className="visually-hidden"> (opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <Link to={target} viewTransition className={className} {...rest}>
      {children}
    </Link>
  );
}
