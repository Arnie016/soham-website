import { Header, Footer } from "@/components/site-shell";
import { ProjectIndex } from "@/components/projects";
export const metadata = { title: "Selected work" };
export default function Work() {
  return (
    <>
      <Header />
      <main id="main" className="section work-page">
        <div className="page-heading">
          <span className="eyebrow">SELECTED WORK · 2022–2026</span>
          <h1>
            A collection of
            <br />
            <em>possibilities.</em>
          </h1>
          <p>
            Architecture, interiors, drawings and explorations.
            <br />
            Each project is a different way of asking what a space can become.
          </p>
        </div>
        <ProjectIndex />
      </main>
      <Footer />
    </>
  );
}
