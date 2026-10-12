import projects from "@/content/projects.json";
import { PRITHVIKA_BLOCKS, thesisSheet } from "@/lib/spatial/prithvika-content";
export type Source = { title: string; href: string; image?: string };
export type Entry = {
  id: string;
  title: string;
  text: string;
  tags: string;
  project?: string;
  sources: Source[];
};
export const entries: Entry[] = [
  ...projects.map((p) => ({
    id: p.id,
    title: p.title,
    project: p.id,
    text: `${p.subtitle}. ${p.description.slice(0, 1).join(" ")} Scope: ${p.scope}. ${p.role}.`,
    tags: `${p.title} ${p.subtitle} ${p.category} ${p.location} ${p.scope}`,
    sources: [
      {
        title: `Explore ${p.title}`,
        href: `/work/${p.id}`,
        image: p.heroPage
          .replace("/portfolio/", "/portfolio-hd/")
          .replace(".jpg", "-800.webp"),
      },
      {
        title:
          p.id === "prithvika"
            ? "Thesis portfolio · PDF"
            : "Design portfolio · PDF",
        href:
          p.id === "prithvika"
            ? "/downloads/thesis-2026-portfolio.pdf"
            : "/downloads/internship-portfolio.pdf",
      },
    ],
  })),
  {
    id: "materials",
    title: "Prithvika · materials and climate",
    project: "prithvika",
    tags: "sustainable sustainability material materials brick stone timber fly ash climate green roof courtyard shade environmental ecology",
    text: "The thesis proposes fly-ash brick, stone and timber, with courtyards, shaded connections, terraces and green roofs. These are design strategies in an academic proposal, not measured performance from a completed building.",
    sources: [
      { title: "Environmental studies · sheet 8", href: thesisSheet(8) },
      { title: "Prithvika project", href: "/work/prithvika" },
    ],
  },
  {
    id: "restoration",
    title: "Prithvika · ecological repair",
    project: "prithvika",
    tags: "sustainable sustainability reclamation coal refinery mine mining restoration remediation water wetland bioswale soil planting biochar phytoremediation mycoremediation",
    text: "Prithvika is a coal-land reclamation research campus, not a coal refinery. The proposal uses wetlands, bioswales, plantation belts and restoration zones. Soham studies phytoremediation, mycoremediation and biochar as possible routes to soil and water repair. The portfolio does not establish measured remediation outcomes.",
    sources: [
      { title: "Concept and restoration · sheet 13", href: thesisSheet(13) },
      {
        title: "Thesis portfolio · PDF",
        href: "/downloads/thesis-2026-portfolio.pdf#page=13",
      },
    ],
  },
  ...Object.entries(PRITHVIKA_BLOCKS).map(([id, b]) => ({
    id: `block-${id}`,
    title: b.title,
    project: "prithvika",
    tags: `${b.title} ${id} floor floors level levels laboratory labs room rooms ${b.summary}`,
    text: `${b.summary} ${b.floors.map((f, i) => `${i === 0 ? "Ground floor" : `Level ${i}`}: ${f}`).join(" ")} ${id === "exhibition" ? "The three tiers in the interactive model are a schematic interpretation of the render." : ""}`,
    sources: [
      {
        title: `Original drawing · sheet ${b.sheet}`,
        href: thesisSheet(b.sheet),
      },
      {
        title: "Thesis PDF",
        href: `/downloads/thesis-2026-portfolio.pdf#page=${b.sheet}`,
      },
    ],
  })),
  {
    id: "services",
    title: "What Soham can help with",
    tags: "services service deliver delivers deliverables help offer offers homeowner builder home house building construction architecture interior interiors renovation renovate visualization visualisation 3d concept design",
    text: "Soham offers architecture, interiors and renovation, 3D visualisation, and concept development. A new home can begin with site and space planning; an interior can begin with layout and material options; a visualisation commission can help you review an idea before building. Exact drawings, image counts, revisions, site involvement, fees and schedule are agreed for your project.",
    sources: [
      { title: "Services and process", href: "/services" },
      { title: "Discuss your project", href: "/contact" },
    ],
  },
  {
    id: "success",
    title: "Agree what success means for your project",
    tags: "kpi kpis results outcomes benefit benefits roi performance success savings energy cost budget measure metrics value help",
    text: "The portfolio does not publish verified client KPIs, construction savings or energy-performance results. Useful targets to agree with Soham could include the required spaces, area and budget constraints, daylight priorities, agreed drawings or renders, review rounds and delivery dates. These are suggested briefing criteria, not promised outcomes.",
    sources: [
      { title: "Discuss scope and priorities", href: "/contact" },
      { title: "How the services work", href: "/services" },
    ],
  },
  {
    id: "fees",
    title: "Fees, timing and availability",
    tags: "fee fees price pricing quote cost costs charges budget affordable rate rates timeline deadline time timing schedule availability available commission hire contact phone email consultation",
    text: "Fees, availability and delivery dates are not published in the portfolio. Share your location, service, approximate scope and timing with Soham so he can propose the right deliverables. Contact sohamkhetan@gmail.com or +91 93568 46922.",
    sources: [
      { title: "Start a project", href: "/contact" },
      { title: "Call Soham", href: "tel:+919356846922" },
    ],
  },
  {
    id: "about",
    title: "Meet Soham",
    tags: "soham architect about background education experience cv resume location based languages software",
    text: "Soham Khetan is based in Chandrapur, Maharashtra, and works across architecture, interiors, concept design and 3D visualisation. The site presents academic, thesis and competition work. Read the CV for his education and experience; these projects should not be taken as evidence of completed client commissions.",
    sources: [
      { title: "About Soham", href: "/about" },
      { title: "Soham’s CV · PDF", href: "/cv/Soham-Khetan-CV.pdf" },
    ],
  },
  {
    id: "documents",
    title: "Original portfolios",
    tags: "pdf portfolio portfolios document documents download brochure drawings book thesis internship",
    text: "Read Soham’s original thesis portfolio for Prithvika, or the internship portfolio for the broader design work. The website project pages provide a shorter introduction and individual sheets.",
    sources: [
      {
        title: "Thesis 2026 · PDF",
        href: "/downloads/thesis-2026-portfolio.pdf",
      },
      {
        title: "Internship portfolio · PDF",
        href: "/downloads/internship-portfolio.pdf",
      },
      { title: "All projects", href: "/work" },
    ],
  },
];
const stop = new Set(
  "a an the what how why is are does do can could would should i me my for to of in on it its this that with and or you your he his soham tell more about please show want need".split(
    " ",
  ),
);
const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w));
export type GuideReply = {
  answer: string;
  cards: Entry[];
  suggestions: string[];
  context: string | null;
  mode: "portfolio-search";
};
export function answerQuestion(
  question: string,
  context?: string | null,
): GuideReply {
  const q = question.toLowerCase();
  const direct = projects.find(
    (p) => q.includes(p.title.toLowerCase()) || q.includes(p.id),
  );
  const project =
    direct?.id || (projects.some((p) => p.id === context) ? context : null);
  const tokens = tokenize(question);
  let ranked = entries
    .map((e) => {
      const title = e.title.toLowerCase(),
        hay = `${e.tags} ${e.text}`.toLowerCase();
      let score = tokens.reduce(
        (s, t) => s + (title.includes(t) ? 4 : hay.includes(t) ? 1 : 0),
        0,
      );
      if (direct?.id === e.id) score += 6;
      const block = q.match(/research\s*(?:block\s*)?([bcd])\b/);
      if (block && e.id === `block-research-${block[1]}`) score += 30;
      if (project && e.project === project && score > 0) score += 2;
      if (/material|brick|timber|stone/.test(q) && e.id === "materials")
        score += 15;
      if (/sustain|restor|remedi|refiner/.test(q) && e.id === "restoration")
        score += 12;
      if (
        /\b(kpis?|roi|metrics?|savings|benefits?|outcomes?)\b/.test(q) &&
        e.id === "success"
      )
        score += 16;
      if (
        /\b(pdf|download|documents?|portfolios?)\b/.test(q) &&
        e.id === "documents"
      )
        score += 10;
      if (
        /\b(fees?|prices?|pricing|cost|charges|timeline|availability)\b/.test(
          q,
        ) &&
        e.id === "fees"
      )
        score += 14;
      if (
        /\b(services|architecture|offer|deliver|home|house|renovat|interior|visualis|visualiz)/.test(
          q,
        ) &&
        e.id === "services"
      )
        score += 8;
      if (
        project &&
        /^(tell me more|more|and the floors|what about it)[?.! ]*$/.test(q) &&
        e.id === project
      )
        score += 8;
      return { e, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);
  if (/ignore (all|previous)|system prompt|api key|secret|instruction/.test(q))
    ranked = [];
  const cards = ranked
    .slice(0, /compare|difference|versus/.test(q) ? 2 : 1)
    .map((x) => x.e);
  return {
    answer: cards.length
      ? "Here’s what the portfolio documents."
      : "I can help you explore Soham’s projects, services and original drawings. I couldn’t find a reliable match for that question. Try a project name or one of these topics.",
    cards,
    context:
      direct?.id || project || cards.find((c) => c.project)?.project || null,
    mode: "portfolio-search",
    suggestions: cards.some((c) => c.project === "prithvika")
      ? [
          "What materials does Prithvika use?",
          "Show Research Block C",
          "Can I read the thesis PDF?",
        ]
      : [
          "What can Soham deliver for my home?",
          "Explore Prithvika",
          "What KPIs can we agree?",
        ],
  };
}
