import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Header, Footer } from "@/components/site-shell";
import { PortfolioImage } from "@/components/portfolio-image";
import { ThreeStudy } from "@/components/three-study";
export const metadata = { title: "Architecture & design services" };
const offerings = [
  {
    title: "Architecture",
    who: "FOR HOMEOWNERS & BUILDERS",
    copy: "A new home or a new building starts with understanding its place. Explore a design that balances how you live, how the site behaves and what you want to invest.",
    items: [
      "Site and brief discussions",
      "Spatial planning and architectural concepts",
      "Design development and agreed drawing packages",
    ],
    image: "/portfolio/thesis/page-01.jpg",
  },
  {
    title: "Interiors & renovation",
    who: "FOR SPACES READY FOR CHANGE",
    copy: "A more useful layout, a different material palette or a complete rethink. Find what your existing space can become.",
    items: [
      "Layout and space planning",
      "Material, furniture and lighting direction",
      "Interior views and design details",
    ],
    image: "/portfolio/internship/page-18.jpg",
  },
  {
    title: "3D visualisation",
    who: "FOR CLIENTS & DESIGN PROFESSIONALS",
    copy: "You can commission visualisation on its own. See an architectural idea, explain it to your team or present it to a client.",
    items: [
      "Architectural exterior views",
      "Interior visualisations",
      "Presentation imagery from an agreed brief",
    ],
    image: "/portfolio/internship/page-10.jpg",
  },
  {
    title: "Concept development",
    who: "FOR THE FIRST STAGES OF AN IDEA",
    copy: "An early design direction can clarify what is possible before the project grows. Work through the story, the spatial approach and the alternatives.",
    items: [
      "Design research and concept studies",
      "Massing and spatial exploration",
      "Concept boards and presentation narratives",
    ],
    image: "/portfolio/internship/page-07.jpg",
  },
];
export default function Services() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="section page-heading">
          <span className="eyebrow">SERVICES</span>
          <h1>
            The right support.
            <br />
            <em>For your space.</em>
          </h1>
          <p>
            For new homes, spaces that need a rethink, and ideas that need to be
            seen.
            <br />
            We’ll agree the scope, deliverables and fee around your project.
          </p>
        </section>
        {offerings.map((o, i) => (
          <section key={o.title} className="section service-detail">
            <div className="service-detail-image">
              <PortfolioImage
                src={o.image}
                alt={`Design study illustrating ${o.title.toLowerCase()}`}
                loading="lazy"
              />
            </div>
            <div>
              <span className="eyebrow">{o.who}</span>
              <h2>{o.title}</h2>
              <p>{o.copy}</p>
              <ul>
                {o.items.map((item) => (
                  <li key={item}>
                    <Check size={15} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                className="text-link"
                href={`/contact?service=${encodeURIComponent(o.title)}`}
              >
                Discuss your project <ArrowUpRight size={18} />
              </Link>
            </div>
          </section>
        ))}
        <section className="section service-note">
          <span className="eyebrow">NOT SURE WHERE TO START?</span>
          <h2>
            A short brief is <em>enough.</em>
          </h2>
          <p>
            You don’t need finished plans to begin a conversation. Tell me what
            you’re considering, and we can work out the next step.
          </p>
          <Link className="button" href="/contact">
            Tell me your idea <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
