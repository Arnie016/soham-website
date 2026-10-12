export const PRITHVIKA_BLOCKS: Record<
  string,
  { title: string; sheet: number; summary: string; floors: string[] }
> = {
  academic: {
    title: "Academic Block A",
    sheet: 18,
    summary:
      "Teaching, shared learning and a courtyard at the heart of the academic block.",
    floors: [
      "Faculty cubicles, smart classrooms and the open courtyard.",
      "Lecture hall, library, discussion lounge and student common.",
      "Multipurpose hall, tutorial rooms and a green roof.",
    ],
  },
  "research-b": {
    title: "Research Block B",
    sheet: 19,
    summary:
      "Research into coal, fuels and mining processes alongside prototyping spaces.",
    floors: [
      "Wet laboratory, incubation, prototyping, and drilling and blasting lab.",
      "Chemical assaying, mine ventilation, coal and fuel characterisation, and a green roof.",
    ],
  },
  exhibition: {
    title: "Circular Exhibition",
    sheet: 14,
    summary:
      "The exhibition block sits within the concentric landscape between the research wings.",
    floors: [
      "Lower exhibition tier; the circular landscape connects the surrounding blocks.",
      "Middle exhibition tier, reconstructed from the thesis render.",
      "Upper exhibition tier, reconstructed from the thesis render.",
    ],
  },
  "research-c": {
    title: "Research Block C",
    sheet: 20,
    summary:
      "Environmental research, energy systems and digital analysis share a courtyard block.",
    floors: [
      "Specialised research, data and simulation, R&D studios and energy systems.",
      "Environmental geochemistry, remote sensing and GIS, data and simulation, and a green roof.",
    ],
  },
  "research-d": {
    title: "Research Block D",
    sheet: 21,
    summary:
      "Pilot-scale testing, mineral processing and land-restoration research.",
    floors: [
      "Geographical exploration, pilot plant, mineral processing and rock mechanics labs.",
      "Revegetation and overburden-dump labs, research offices and energy systems.",
      "Revegetation, exploration and pilot-plant research around the open courtyard.",
    ],
  },
  admin: {
    title: "Administration Block",
    sheet: 14,
    summary:
      "The administration block is identified in the northern part of the site plan.",
    floors: [
      "Schematic floor; a detailed room plan is not included in the supplied block sheets.",
      "Schematic upper floor based on the overall campus views.",
    ],
  },
  residence: {
    title: "Student Hostel",
    sheet: 14,
    summary:
      "Student accommodation sits along the eastern edge, beside the guest-house cluster.",
    floors: [
      "Schematic accommodation floor identified from the site plan.",
      "Schematic accommodation floor; room layouts are not modelled.",
      "Schematic accommodation floor; room layouts are not modelled.",
    ],
  },
};
export const thesisSheet = (page: number) =>
  `/portfolio-hd/thesis/page-${String(page).padStart(2, "0")}-3840.webp`;
