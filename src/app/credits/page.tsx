import Link from "next/link";
import { Header, Footer } from "@/components/site-shell";
export const metadata = { title: "Project & asset credits" };
export default function Credits() {
  return (
    <>
      <Header />
      <main id="main" className="asset-credits">
        <span className="spatial-kicker">PROJECT & ASSET CREDITS</span>
        <h1>Made from real work.</h1>
        <p>
          Prithvika, its thesis drawings, renders and design are by Soham
          Khetan. The interactive campus is a schematic reconstruction from that
          portfolio. Landscape props provide visual context; they do not
          represent a specified planting or furniture schedule.
        </p>
        <h2>Free Sketchfab assets</h2>
        <ul>
          <li>
            <a
              href="https://sketchfab.com/3d-models/5ff5a51e74324845a4e4905f182dfb2b"
              target="_blank"
              rel="noopener noreferrer"
            >
              Low Poly Forest Tree Pack
            </a>{" "}
            by{" "}
            <a
              href="https://sketchfab.com/99.Miles"
              target="_blank"
              rel="noopener noreferrer"
            >
              99.Miles
            </a>
            . Broadleaf silhouettes and shrubs selected; textures resized,
            meshes instanced and scaled for this scene.
          </li>
          <li>
            <a
              href="https://sketchfab.com/3d-models/e53ad46c604c44e59a98bad27041cb19"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wooden Park Bench
            </a>{" "}
            by{" "}
            <a
              href="https://sketchfab.com/TheMadraver"
              target="_blank"
              rel="noopener noreferrer"
            >
              TheMadraver
            </a>
            . Textures resized; model scaled and placed in the circular
            landscape.
          </li>
        </ul>
        <p>
          Both assets are used under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Creative Commons Attribution 4.0
          </a>
          . The original creators do not endorse this site. No paid assets were
          used.
        </p>
        <h2>Sustainability film</h2>
        <p>
          The captioned film uses the supplied Prithvika thesis drawings and
          renders, with text based on sheets 8, 13–14 and 17–21. It describes a
          design proposal, not verified environmental performance.
        </p>
        <Link className="spatial-text-link" href="/work/prithvika">
          Explore the complete Prithvika portfolio ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
