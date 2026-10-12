import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/site-shell";
import { Gallery } from "@/components/projects";
import projects from "@/content/projects.json";
import { PortfolioImage } from "@/components/portfolio-image";
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: projects.find((p) => p.id === slug)?.title || "Project" };
}
export default async function Project({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((p) => p.id === slug);
  if (!p) notFound();
  const next = projects[(projects.indexOf(p) + 1) % projects.length];
  return (
    <>
      <Header />
      <main id="main" className="project-page">
        <section className="section">
          <Link className="back-link" href="/work">
            <ArrowLeft size={16} /> All projects
          </Link>
          <div className="project-heading">
            <div>
              <span className="eyebrow">
                {p.category} ·{" "}
                {p.category === "Competition"
                  ? "COMPETITION ENTRY"
                  : p.category === "Sketches"
                    ? "PERSONAL WORK"
                    : "ACADEMIC DESIGN"}
              </span>
              <h1>{p.title}</h1>
              <p>{p.subtitle}</p>
            </div>
            <span className="project-year">{p.year}</span>
          </div>
          <PortfolioImage
            className="project-cover"
            src={p.heroPage}
            alt={`${p.title} project presentation`}
            fetchPriority="high"
            sizes="90vw"
          />
          <div className="project-narrative">
            <div>
              <span className="eyebrow">THE IDEA</span>
              <h2>
                {
                  (
                    {
                      prithvika: "A landscape, given a new beginning.",
                      "crest-harbour": "Shared spaces in vertical housing.",
                      "monjee-university": "A campus connected by courtyards.",
                      "unit-one-market": "Making room for the everyday market.",
                      "evolve-io": "A workplace built around collaboration.",
                      nirmaan: "From spatial ideas to precise details.",
                      "aalo-chhaya":
                        "Finding new uses for discarded materials.",
                      "vds-2023": "Imagining life on water.",
                      sketchbook: "Thinking, one drawing at a time.",
                    } as Record<string, string>
                  )[p.id]
                }
              </h2>
              {p.description.slice(0, 2).map((text) => (
                <p key={text}>{text.replaceAll(" — ", "; ")}</p>
              ))}
            </div>
            <dl>
              {[
                ["Location", p.location],
                ["Project type", p.program],
                ["Scope", p.scope],
                ["Role", p.role],
                ["Tools", p.software],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className="section drawings-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM THE DRAWING BOARD</span>
              <h2>
                The design, <em>in detail.</em>
              </h2>
            </div>
            <div className="portfolio-download">
              <p className="caption">Select a drawing to explore it in 4K.</p>
              <a
                href={
                  p.category === "Thesis"
                    ? "/downloads/thesis-2026-portfolio.pdf"
                    : "/downloads/internship-portfolio.pdf"
                }
                download
              >
                Download the portfolio <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
          <Gallery pages={p.pages} title={p.title} />
        </section>
        <section className="section next-project">
          <span className="eyebrow">NEXT PROJECT</span>
          <Link href={`/work/${next.id}`}>
            <h2>{next.title}</h2>
            <ArrowUpRight size={40} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
