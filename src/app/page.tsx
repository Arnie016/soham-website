import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/site-shell";
import { Sustainability } from "@/components/sustainability";
import { HomeExperience } from "@/components/home-experience";
import { Reveal, SpatialWork } from "@/components/spatial-effects";
const services = [
  {
    title: "Architecture",
    detail: "From a plot of land to a place of your own.",
    visual: "building",
  },
  {
    title: "Interiors & renovation",
    detail: "A fresh perspective on the space you already have.",
    visual: "interior",
  },
  {
    title: "3D visualisation",
    detail: "See the possibilities before the first brick is laid.",
    visual: "render",
  },
  {
    title: "Concept development",
    detail: "Give your first idea a direction worth pursuing.",
    visual: "concept",
  },
];
export default function Home() {
  return (
    <div className="spatial-home">
      <Header />
      <main id="main">
        <HomeExperience />
        <Sustainability />
        <section className="spatial-intro spatial-section">
          <Reveal>
            <span className="spatial-kicker">
              A PRACTICE BUILT ON CURIOSITY
            </span>
            <h2>
              Not just a space.
              <br />
              <span>Your way of life.</span>
            </h2>
          </Reveal>
          <Reveal className="spatial-intro-note">
            <span className="intro-symbol" aria-hidden="true">
              ↳
            </span>
            <p>
              I’m Soham Khetan, an architect based in Chandrapur. I design
              around the things that make a place yours: the morning light, the
              way you gather, the moments in between.
            </p>
            <Link className="spatial-text-link" href="/about">
              Meet the architect <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>
        <section className="spatial-section spatial-work" id="selected-work">
          <Reveal className="spatial-section-head">
            <div>
              <span className="spatial-kicker">SELECTED WORK · 2022–2026</span>
              <h2>
                Different spaces.
                <br />
                <span>One curious mind.</span>
              </h2>
            </div>
            <Link className="spatial-text-link" href="/work">
              Explore all projects <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <SpatialWork />
          <p className="spatial-work-note">
            Academic, thesis and competition work. Explore each project for the
            story, scope and original drawings.
          </p>
        </section>
        <section className="spatial-services spatial-section">
          <Reveal className="spatial-services-heading">
            <span className="spatial-kicker">WHAT WE CAN CREATE TOGETHER</span>
            <h2>
              Big plans.
              <br />
              <span>Small details.</span>
            </h2>
            <p>
              A new home, a different interior, or an idea you want to see in
              3D. Start with what you need.
            </p>
            <Link href="/services" className="spatial-text-link">
              Explore the services <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <div className="spatial-service-list">
            {services.map((s) => (
              <Reveal key={s.title}>
                <Link
                  className="spatial-service"
                  href={`/contact?service=${encodeURIComponent(s.title)}`}
                >
                  <div
                    className={`service-object ${s.visual}`}
                    aria-hidden="true"
                  >
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.detail}</p>
                  </div>
                  <ArrowUpRight size={23} />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="spatial-process spatial-section">
          <Reveal>
            <span className="spatial-kicker">
              FROM CONVERSATION TO CREATION
            </span>
            <h2>
              A thoughtful process.
              <br />
              <span>Room for your ideas.</span>
            </h2>
          </Reveal>
          <div className="spatial-process-grid">
            {[
              [
                "01",
                "Begin with you",
                "Your site. Your needs. Your budget. We start by listening and agreeing what your project needs.",
              ],
              [
                "02",
                "Explore in detail",
                "Plans, materials and visualisations make the possibilities easier to see, discuss and refine.",
              ],
              [
                "03",
                "Bring it together",
                "Review drawings, share feedback and agree the next steps as your design takes shape.",
              ],
            ].map(([n, title, text]) => (
              <Reveal key={n}>
                <span className="process-index">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="spatial-portal-link">
            <span>Already working together?</span>
            <Link href="/login">
              Enter your project space <ArrowRight size={17} />
            </Link>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
