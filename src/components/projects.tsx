"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import data from "@/content/projects.json";
import { PortfolioImage, portfolioResolution } from "./portfolio-image";
const categories = [
  "All work",
  "Architecture",
  "Interiors",
  "Technical",
  "Explorations",
];
export type PortfolioProject = (typeof data)[number];
export function ProjectCard({
  project,
  large = false,
}: {
  project: PortfolioProject;
  large?: boolean;
}) {
  const p = project;
  return (
    <Link
      href={`/work/${p.id}`}
      className={`project-card ${large ? "large" : ""}`}
    >
      <div className={`project-image ${p.id}`}>
        <PortfolioImage
          src={p.heroPage}
          alt={`${p.title}: ${p.subtitle}`}
          loading="lazy"
        />
        <span className="project-open">
          <ArrowUpRight size={22} />
        </span>
        <span className="project-kind">
          {p.category === "Thesis"
            ? "THESIS"
            : p.category === "Competition"
              ? "COMPETITION"
              : p.category === "Sketches"
                ? "PERSONAL EXPLORATIONS"
                : "ACADEMIC DESIGN"}
        </span>
      </div>
      <div className="project-card-caption">
        <h3>{p.title}</h3>
        <span>
          {p.category} <span>·</span> {p.location.split(",")[0]}
        </span>
      </div>
    </Link>
  );
}
export function ProjectIndex() {
  const [filter, setFilter] = useState("All work");
  const filtered = data.filter(
    (p) =>
      filter === "All work" ||
      (filter === "Architecture" &&
        ["Thesis", "Housing", "Institutional", "Urban / Commercial"].includes(
          p.category,
        )) ||
      (filter === "Interiors" && p.category === "Interior") ||
      (filter === "Technical" && p.category === "Technical") ||
      (filter === "Explorations" &&
        ["Competition", "Sketches"].includes(p.category)),
  );
  return (
    <>
      <div className="filters" aria-label="Filter projects">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="work-grid" aria-live="polite">
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </>
  );
}
export function Gallery({ pages, title }: { pages: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <div className="project-gallery">
      {pages.map((src, i) => (
        <button
          key={src}
          className="board"
          onClick={() => setIndex(i)}
          aria-label={`Enlarge ${title} drawing ${i + 1}`}
        >
          <PortfolioImage
            src={src}
            alt={`${title}, original portfolio drawing ${i + 1}`}
            loading="lazy"
          />
          <span>
            DRAWING {String(i + 1).padStart(2, "0")}
            <Maximize2 size={16} />
          </span>
        </button>
      ))}
      {index !== null && (
        <Lightbox
          src={portfolioResolution(pages[index])}
          title={`${title} · Drawing ${index + 1} of ${pages.length}`}
          close={() => setIndex(null)}
          prev={index > 0 ? () => setIndex(index - 1) : undefined}
          next={
            index < pages.length - 1 ? () => setIndex(index + 1) : undefined
          }
        />
      )}
    </div>
  );
}
import { useEffect, useRef } from "react";
function Lightbox({
  src,
  title,
  close,
  prev,
  next,
}: {
  src: string;
  title: string;
  close: () => void;
  prev?: () => void;
  next?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const focused = document.activeElement as HTMLElement;
    d?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = original;
      focused?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className="lightbox" onCancel={close} aria-label={title}>
      <header>
        <span>{title}</span>
        <button onClick={close} aria-label="Close drawing">
          <X />
        </button>
      </header>
      <div className="lightbox-image">
        <img src={src} alt={title} />
      </div>
      <footer>
        <button onClick={prev} disabled={!prev}>
          <ChevronLeft />
          Previous
        </button>
        <a href={src} target="_blank" rel="noreferrer">
          Open 4K drawing <ArrowUpRight size={16} />
        </a>
        <button onClick={next} disabled={!next}>
          Next
          <ChevronRight />
        </button>
      </footer>
    </dialog>
  );
}
