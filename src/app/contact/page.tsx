import { Suspense } from "react";
import { ContactEntry } from "@/components/contact-entry";
import { Header, Footer } from "@/components/site-shell";
import { ContactForm } from "@/components/contact-form";
import { ContactActions } from "@/components/contact-actions";
export const metadata = { title: "Start a project" };
export default function Contact() {
  return (
    <>
      <Header />
      <main id="main" className="section contact-page">
        <div className="contact-copy">
          <figure className="contact-visual">
            <img
              src="/portfolio-hd/internship/page-18-800.webp"
              width="800"
              height="566"
              alt="Interior design from Soham’s Evolve.io portfolio"
              fetchPriority="high"
            />
            <figcaption>From the portfolio · Evolve.io</figcaption>
          </figure>
          <span className="eyebrow">YOUR PROJECT STARTS HERE</span>
          <h1>
            Let’s make
            <br />
            <em>room for it.</em>
          </h1>
          <p>
            A new home, a renovation, an interior or an idea you’d like to see
            in 3D. Tell me what you have in mind.
          </p>
          <div className="direct-contact">
            <span className="eyebrow">PREFER A CONVERSATION?</span>
            <ContactActions />
            <p>
              Based in Chandrapur, Maharashtra.
              <br />
              English · Hindi · Marwadi · Marathi
            </p>
          </div>
        </div>
        <div className="contact-form-panel">
          <h2>A little about your project</h2>
          <Suspense fallback={<ContactForm />}>
            <ContactEntry />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
