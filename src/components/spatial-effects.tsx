"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import projects from "@/content/projects.json";
import { PortfolioImage } from "./portfolio-image";
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`spatial-reveal ${className}`}>{children}</div>;
}
const picks = [projects[0], projects[4], projects[1], projects[2]];
const captions = [
  "A landscape, given a new beginning.",
  "A different way to work together.",
  "Life, between the buildings.",
  "Learning beyond the classroom.",
];
export function SpatialWork() {
  return (
    <div className="spatial-work-grid">
      {picks.map((p, i) => (
        <Reveal key={p.id} className={`spatial-work-item work-item-${i}`}>
          <Link href={`/work/${p.id}`} className="spatial-project">
            <div className={`spatial-project-image ${p.id}`}>
              <PortfolioImage
                src={p.heroPage}
                alt={`${p.title}: ${p.subtitle}`}
                loading="lazy"
                sizes="(max-width: 700px) 90vw, 45vw"
              />
              <span className="spatial-image-label">
                {p.category === "Thesis" ? "THESIS" : "ACADEMIC DESIGN"}
              </span>
              <span className="spatial-project-arrow">
                <ArrowUpRight size={24} />
              </span>
            </div>
            <div className="spatial-project-title">
              <h3>{p.title}</h3>
              <span>{p.year}</span>
            </div>
            <p>{captions[i]}</p>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
