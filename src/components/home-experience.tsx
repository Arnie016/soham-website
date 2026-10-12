"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Box } from "lucide-react";
const Campus = dynamic(() => import("./hero").then((m) => m.Hero), {
  loading: () => (
    <p className="campus-loading" role="status">
      Opening the interactive campus…
    </p>
  ),
});
export function HomeExperience() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // A phone should not download or construct the 3D editor just to browse.
    if (
      matchMedia(
        "(min-width: 801px) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      setActive(true);
  }, []);
  if (active)
    return (
      <div className="home-experience campus-active">
        <Campus />
      </div>
    );
  return (
    <section
      className="visual-welcome home-experience"
      aria-label="Prithvika campus"
    >
      <img
        src="/portfolio-hd/thesis/page-01-800.webp"
        srcSet="/portfolio-hd/thesis/page-01-800.webp 800w, /portfolio-hd/thesis/page-01-1600.webp 1600w"
        sizes="100vw"
        width="1600"
        height="1131"
        fetchPriority="high"
        alt="Soham’s Prithvika campus render: research wings arranged around a circular exhibition in a restored landscape"
      />
      <div className="visual-welcome-copy">
        <span className="eyebrow">PRITHVIKA / SOHAM KHETAN</span>
        <h1>
          New life.
          <br />
          <em>Rooted in place.</em>
        </h1>
        <p>A research campus imagined for reclaimed coal land.</p>
        <div>
          <Link href="/work/prithvika">
            Explore the project <ArrowUpRight size={18} />
          </Link>
          <button
            onClick={() => {
              setActive(true);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            <Box size={17} /> Explore in 3D
          </button>
        </div>
      </div>
      <span className="visual-caption">
        Thesis proposal · Chandrapur, India
      </span>
    </section>
  );
}
