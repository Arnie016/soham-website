"use client";
import Link from "next/link";
import { GMAIL_COMPOSE } from "@/lib/contact";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header
      className={`site-header spatial-header ${path === "/" ? "over-scene" : ""}`}
    >
      <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
        <span className="architect-mark" aria-hidden="true">
          <svg viewBox="0 0 36 40">
            <path d="M3 37V3h17v34M20 15h13v22M3 25h30M10 3v34" />
          </svg>
        </span>
        <span>
          <strong>Soham Khetan</strong>
          <small>ARCHITECTURE & DESIGN</small>
        </span>
      </Link>
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="main-nav"
        className={open ? "open" : ""}
        aria-label="Main navigation"
      >
        {[
          ["/work", "Selected work"],
          ["/#sustainability", "Sustainability"],
          ["/services", "Services"],
          ["/about", "About"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            onClick={(event) => {
              setOpen(false);
              if (href === "/#sustainability" && path === "/") {
                event.preventDefault();
                window.dispatchEvent(new Event("prithvika:watch"));
              }
            }}
          >
            {label}
          </Link>
        ))}
        <Link
          className="portal-link"
          href="/login"
          onClick={() => setOpen(false)}
        >
          Client login
        </Link>
        <Link
          className="nav-cta"
          href="/contact"
          onClick={() => setOpen(false)}
        >
          Start a project <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer spatial-footer">
      <div className="footer-invite">
        <span className="eyebrow">
          A NEW PERSPECTIVE STARTS WITH A CONVERSATION
        </span>
        <h2>
          Let’s make
          <br />
          <em>room.</em>
        </h2>
        <Link className="button light" href="/contact">
          Tell me your idea <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="footer-details">
        <div>
          <span className="eyebrow">GET IN TOUCH</span>
          <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer">
            sohamkhetan@gmail.com
          </a>
          <a href="tel:+919356846922">+91 93568 46922</a>
          <span>Chandrapur, Maharashtra</span>
        </div>
        <div>
          <span className="eyebrow">EXPLORE</span>
          <Link href="/work">Selected work</Link>
          <Link href="/services">Services</Link>
          <Link href="/about">About Soham</Link>
          <Link href="/login">Client workspace</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Soham Khetan</span>
        <span>Architecture. Interiors. Possibilities.</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/credits">Project & asset credits</Link>
      </div>
    </footer>
  );
}
