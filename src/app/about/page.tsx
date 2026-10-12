import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { Header, Footer } from "@/components/site-shell";
export const metadata = { title: "About Soham" };
export default function About() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="section about-hero">
          <div>
            <span className="eyebrow">SOHAM KHETAN · CHANDRAPUR</span>
            <h1>
              Architect by training.
              <br />
              <em>Curious by nature.</em>
            </h1>
            <p>
              I’m interested in spaces that balance function with experience. In
              plans that make everyday life easier, and materials that belong to
              their place.
            </p>
            <p>
              Gaming, sport and travel shape how I think about pace, atmosphere
              and stories. Architecture brings those observations back to the
              physical world.
            </p>
            <Link className="button" href="/contact">
              Let’s start a conversation <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="portrait-composition">
            <div className="portrait-window">
              <img
                src="/cv/soham-portrait.jpg"
                width={1086}
                height={1448}
                alt="Soham Khetan in an architecture studio"
              />
            </div>
            <span className="portrait-label">
              Soham Khetan<small>Architecture & design</small>
            </span>
          </div>
        </section>
        <section className="section about-details">
          <div>
            <span className="eyebrow">EDUCATION</span>
            <h2>
              A foundation in
              <br />
              <em>architecture.</em>
            </h2>
            <h3>Sri Sri University</h3>
            <p>Bachelor of Architecture · 2021–2026</p>
            <a className="text-link" href="/cv/Soham-Khetan-CV.pdf" download>
              Download my CV <Download size={16} />
            </a>
          </div>
          <div>
            <span className="eyebrow">EXPERIENCE</span>
            <h2>
              From the drawing
              <br />
              to the <em>site.</em>
            </h2>
            <h3>99 Studios, Ahmedabad</h3>
            <p>Architectural intern · June–November 2025</p>
            <p>
              Working and execution drawings, site visits and training
              experience on large projects.
            </p>
          </div>
        </section>
        <section className="section about-recognition">
          <span className="eyebrow">
            SELECTED RECOGNITION · AS LISTED IN THE CV
          </span>
          <div>
            <p>
              Evolve Design Competition <span>1st Runner Up · 2024</span>
            </p>
            <p>
              ANDC <span>Top 60 · 2023</span>
            </p>
            <p>
              Vertical Design Studio <span>1st Runner Up · 2022</span>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
