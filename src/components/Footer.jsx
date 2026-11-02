import site from "../data/site.json";
import A from "./A";
import Eclipse from "./Eclipse";
import { PenumbraIcon } from "./Icons";
import { useTheme } from "../lib/hooks";
import { useUI } from "../lib/store";
import { ORIGIN } from "../lib/format";

export function NewsletterForm({ compact }) {
  const { say } = useUI();
  const submit = (e) => {
    e.preventDefault();
    say("Concept build — opening Penumbra’s real sign-up page");
    window.open(`${ORIGIN}/subscribe`, "_blank", "noopener");
  };
  return (
    <form className="newsletter" onSubmit={submit}>
      {!compact && <p className="form-note">Sign up with your email address to receive news and updates.</p>}
      <label className="visually-hidden" htmlFor="nl-email">Email address</label>
      <div className="row">
        <input id="nl-email" className="input" type="email" required placeholder="Email address" autoComplete="email" />
        <button className="btn" type="submit">Sign up</button>
      </div>
      <p className="form-note">We respect your privacy.</p>
    </form>
  );
}

export default function Footer() {
  const [theme, toggleTheme] = useTheme();
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div>
            <Eclipse size={44} label="Penumbra Foundation" />
            <p className="footer-mission">Penumbra Foundation is a non profit organization that brings together the Art and Science of Photography.</p>
            <div className="footer-contact">
              <span>{site.address}</span>
              <a href={`tel:${site.phone.replace(/\D/g, "")}`}>{site.phone}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <span className="faint">Business hours Mon–Fri, 10am–6pm · Galleries Mon–Fri, 2–6pm</span>
            </div>
          </div>
          <div>
            <h2>Visit &amp; learn</h2>
            <ul>
              <li><A to="/workshops">Workshops</A></li>
              <li><A to="/online-learning">Online learning</A></li>
              <li><A to="/book-session">Tintype Studio</A></li>
              <li><A to="/upcoming-exhibitions">Exhibitions</A></li>
              <li><A to="/highlight-studios">Highlight Studios</A></li>
              <li><A to="/visitus">Visit us</A></li>
            </ul>
          </div>
          <div>
            <h2>Support</h2>
            <ul>
              <li><A to="/membership-main">Membership</A></li>
              <li><A to="/donate">Donate</A></li>
              <li><A to="/penumbra-store">Shop</A></li>
              <li><A to="/policies">Policies</A></li>
              <li><A to="/education-faqs">FAQs</A></li>
              <li><A to="/about">About</A></li>
            </ul>
          </div>
          <div>
            <h2>Newsletter</h2>
            <NewsletterForm />
            <ul style={{ display: "flex", gap: 18, marginTop: 18 }}>
              {site.social.map((s) => <li key={s.href}><A href={s.href}>{s.label}</A></li>)}
            </ul>
          </div>
        </div>
        <div className="sponsors">
          <p className="label">Penumbra Foundation’s programs are made possible by our board of trustees, our members, and generous individuals and institutions in our community — with major support from</p>
          <ul>{site.sponsors.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} Penumbra Foundation · a 501(c)(3) non-profit</span>
          <A to="/concept">CUSTOMPEN — a redesign concept by Aqua. Not the official site; bookings and purchases complete on penumbrafoundation.org.</A>
          <button className="theme-toggle" onClick={toggleTheme}><PenumbraIcon />{theme === "dark" ? "Darkroom" : "Paper"}</button>
        </div>
      </div>
    </footer>
  );
}
