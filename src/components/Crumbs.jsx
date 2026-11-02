import A from "./A";
export default function Crumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="crumbs">
        <li><A to="/">Home</A></li>
        {items.map((c, i) => (
          <li key={i}>{c.to && i < items.length - 1 ? <A to={c.to}>{c.label}</A> : <span aria-current={i === items.length - 1 ? "page" : undefined}>{c.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
