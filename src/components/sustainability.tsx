"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Leaf, Play, X } from "lucide-react";
import { thesisSheet } from "@/lib/spatial/prithvika-content";

export function Sustainability() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [videoError, setVideoError] = useState(false);
  function openFilm() {
    opener.current = document.activeElement as HTMLElement;
    if (!dialog.current?.open) dialog.current?.showModal();
    if (video.current) {
      video.current.currentTime = 0;
      video.current.play().catch(() => {
        /* Native controls remain available. */
      });
    }
  }
  function closeFilm() {
    video.current?.pause();
    dialog.current?.close();
    const returnTarget = opener.current?.getClientRects().length
      ? opener.current
      : document.querySelector<HTMLButtonElement>(".menu-toggle");
    returnTarget?.focus({ preventScroll: true });
  }
  useEffect(() => {
    window.addEventListener("prithvika:watch", openFilm);
    return () => window.removeEventListener("prithvika:watch", openFilm);
  }, []);
  return (
    <section
      id="sustainability"
      className="sustainability-section"
      aria-labelledby="sustainability-title"
    >
      <div className="sustainability-heading">
        <span className="spatial-kicker">
          <Leaf size={15} /> THE IDEA BEHIND PRITHVIKA
        </span>
        <h2 id="sustainability-title">
          Architecture as
          <br />
          <em>ecological repair.</em>
        </h2>
        <p>
          Soham’s thesis starts with a scarred coal-mining landscape in
          Chandrapur. The design asks how research, water, planting and
          architecture can help that land recover.
        </p>
        <button className="sustainability-play" onClick={openFilm}>
          <Play size={18} /> Watch the design story <span>29 sec</span>
        </button>
        <span className="sustainability-caption">
          A captioned film using Soham’s original thesis drawings and renders.
        </span>
      </div>
      <button
        className="sustainability-preview"
        onClick={openFilm}
        aria-label="Play Prithvika sustainability film"
      >
        <img
          src="/portfolio-hd/thesis/page-01-800.webp"
          srcSet="/portfolio-hd/thesis/page-01-800.webp 800w, /portfolio-hd/thesis/page-01-1600.webp 1600w"
          sizes="(max-width: 700px) 100vw, 55vw"
          decoding="async"
          alt="Soham’s original Prithvika render showing research wings, the circular exhibition and surrounding landscape"
          loading="lazy"
        />
        <span className="sustainability-preview-play">
          <Play size={24} /> Play film
        </span>
        <span className="sustainability-preview-caption">
          Original thesis render · Soham Khetan, 2026
        </span>
      </button>
      <div className="sustainability-principles">
        <article>
          <span>01 / RESTORE</span>
          <h3>Let the landscape lead.</h3>
          <p>
            Wetlands, bioswales, plantation belts and restoration zones organise
            the campus. The thesis studies phytoremediation, mycoremediation and
            biochar as routes toward soil and water repair.
          </p>
          <a href={thesisSheet(13)} target="_blank" rel="noopener noreferrer">
            Read the concept sheet <ArrowUpRight size={14} />
          </a>
        </article>
        <article>
          <span>02 / RESEARCH</span>
          <h3>Make repair a field of study.</h3>
          <p>
            Blocks B, C and D bring together coal and fuel characterisation,
            environmental geochemistry, remote sensing, revegetation and
            pilot-plant research. Open-field experimentation areas extend that
            work into the landscape.
          </p>
          <a href={thesisSheet(14)} target="_blank" rel="noopener noreferrer">
            Explore the site plan <ArrowUpRight size={14} />
          </a>
        </article>
        <article>
          <span>03 / BUILD</span>
          <h3>Connect material and climate.</h3>
          <p>
            Fly-ash brick, stone and timber inform the material palette.
            Courtyards, terraces, green roofs and shaded connections form part
            of the proposed relationship between buildings and ecology.
          </p>
          <a href={thesisSheet(8)} target="_blank" rel="noopener noreferrer">
            Explore the environmental studies <ArrowUpRight size={14} />
          </a>
        </article>
      </div>
      <div className="sustainability-footnote">
        <p>
          Prithvika is an academic design proposal. These are proposed
          strategies, not measured results from a completed campus.
        </p>
        <Link href="/work/prithvika">
          See the complete thesis <ArrowUpRight size={15} />
        </Link>
      </div>
      <dialog
        ref={dialog}
        className="sustainability-dialog"
        aria-labelledby="film-title"
        onCancel={closeFilm}
        onClose={() => video.current?.pause()}
      >
        <header>
          <div>
            <span>PRITHVIKA / A FILM IN THREE PARTS</span>
            <h2 id="film-title">Architecture as ecological repair</h2>
          </div>
          <button onClick={closeFilm} aria-label="Close sustainability film">
            <X size={21} />
          </button>
        </header>
        <video
          ref={video}
          controls
          playsInline
          preload="none"
          poster="/media/prithvika-sustainability.jpg"
          onError={() => setVideoError(true)}
          aria-label="Prithvika sustainability film, 29 seconds, with on-screen text"
        >
          <source src="/media/prithvika-sustainability.mp4" type="video/mp4" />
          <track
            src="/media/prithvika-sustainability.vtt"
            kind="captions"
            srcLang="en"
            label="English"
          />
          Your browser cannot play this video. The transcript is below.
        </video>
        {videoError && (
          <p role="alert">
            The film could not load.{" "}
            <a href="/media/prithvika-sustainability.mp4">
              Open the video directly
            </a>{" "}
            or read the transcript below.
          </p>
        )}
        <details>
          <summary>Read the film transcript and sources</summary>
          <p>
            <strong>Heal the land.</strong> Prithvika is a research campus
            proposed for reclaimed coal-mining land in Chandrapur. Wetlands,
            bioswales and planting belts shape the proposal.
          </p>
          <p>
            <strong>Make research visible.</strong> Research wings and
            courtyards bring together geochemistry, revegetation and
            mineral-processing studies.
          </p>
          <p>
            <strong>Build with care.</strong> Fly-ash brick, stone and timber.
            Terraces, green roofs and shaded connections support a campus rooted
            in ecological repair. This is an academic proposal; environmental
            outcomes are not verified on a built campus.
          </p>
          <p>
            Based on Soham Khetan’s Thesis 2026, sheets 8, 13–14 and 17–21.{" "}
            <Link href="/work/prithvika" onClick={closeFilm}>
              View the original portfolio.
            </Link>
          </p>
        </details>
        <footer>
          Original drawings and renders by Soham Khetan · Film assembled from
          the supplied portfolio
        </footer>
      </dialog>
    </section>
  );
}
