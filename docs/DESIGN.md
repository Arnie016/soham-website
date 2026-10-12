> Current release: phones lead with original portfolio imagery and load 3D on request. Desktop retains the campus story. Page fades and hidden scroll reveals have been removed. The portfolio guide is source search, with no paid AI. The notes below also preserve earlier design iterations.

---

version: alpha
name: Soham Khetan Architecture
colors:
paper: "#f3f3ef"
surface: "#e9edef"
ink: "#1b3039"
muted: "#51656b"
sky: "#bccbd0"
dark: "#152a34"
line: "#bac5c7"
danger: "#983e31"
typography:
display:
fontFamily: "Manrope, Arial, sans-serif"
accent:
fontFamily: "Cormorant Garamond, Georgia, serif"
body:
fontFamily: "Manrope, Arial, sans-serif"
rounded:
control: "0px"
spacing:
base: "24px"
components:
button:
height: "52px"
field:
height: "45px"
---

# Soham Khetan design system

## Overview

Product promise: help a prospective client understand Soham's design approach, choose relevant support and start a real project conversation.
Primary user and task: homeowners, renovators, builders and design professionals exploring architecture, interiors, 3D visualisation or concept development. Returning clients review their own drawings, messages and next step.
Platform and input: responsive web, phone and desktop, pointer and keyboard.
Emotional direction: spatial, cinematic, tactile and quietly expressive. A model on an architect's table becomes an interactive introduction.
User likes and rejections: the user rejected the first warm-paper, serif-led design as too similar to the original. The accepted implementation brief is a complete visual overhaul, with Three.js as the first experience and beautiful architectural animation. Lead with the model, oversized sans typography, cool sky and limestone. Keep original portfolio work and avoid unsupported client success claims. Remove Emergent branding from the independent build.
Public routes use a portfolio register. Private studio and client routes use an operational register with shared typography and controls.

## Colors

The public runtime source is `src/app/spatial.css :root` (Model B). The YAML mirrors its `--spatial-paper`, `--mist`, `--spatial-ink`, `--spatial-muted`, `--sky`, `--spatial-dark` and `--spatial-line` values. Change both in the same edit. Error red and private workspace controls retain the corresponding `src/app/globals.css` tokens.
Cool sky, limestone and deep slate frame the 3D study. The campus uses soft daylight, textured masonry, shaded glazing and varied planting. Project art provides the remaining color.

## Typography

Self-hosted Manrope leads public display, body, controls and captions. Cormorant Garamond italic accents a few expressive words. The private workspace retains its established typography. Body copy stays plain, avoiding unverified outcomes, credentials and response-time promises.

## Layout

A full-height editable Prithvika study replaces the generic pavilion. The initial landing view keeps editorial copy, the model and one clear editing action visible. Editing reveals a building/floor tree and a surface inspector. At phone widths these become two labelled tabs below the model. Native page scrolling remains available outside the editing canvas. The existing work, service, enquiry and private workspace layouts remain.

## Elevation & Depth

The main accent is an original Three.js model reconstructed schematically from the supplied thesis concept and site-plan sheets 13–14. Seven campus blocks, eighteen floors, the circular exhibition, courtyard openings, landscape and road spine reflect the portfolio. Heights and coordinates are approximate. Floors can be stacked, separated or isolated; surfaces are selected by raycast or labelled selectors. Corner/wall drags and numeric/material edits change geometry. Fifty undo/redo steps, undoable reset, browser-local persistence and a JSON download complete the loop. Reduced motion disables automatic orbit and smooth camera/level transitions. The old pavilion module is retained as unused source; it is no longer imported by the homepage.

Colour on the study uses muted forest (#243a34), drafting paper (#e5e9e6), warm plaster and copper selection accents (#a45d32). The established portfolio typography and remainder of the site retain their earlier identity.

## Shapes

Rectangular imagery and square primary actions, with compact rounded model tools and circular material swatches. No dashboard chart decoration or invented metrics.

## Components

Shared `site-shell.tsx` owns public navigation/footer. `ui.tsx` owns Form, Field, DateLabel, validation feedback, busy buttons, native select and password visibility. `workspace.tsx` owns workspace navigation, resource loading and pagination. `hero.tsx` owns the study interface and local persistence; `lib/spatial/editor-model.ts` owns schematic data, geometry validation and bounded history; `lib/spatial/study-scene.ts` owns Three.js rendering, dirty-level updates, raycasting, drag controls and lifecycle; `app/study.css` owns its responsive layout. `spatial-effects.tsx` owns the portfolio cards; reveal hiding and pointer tilt have been removed. `contact-actions.tsx` owns Gmail, mail-app, phone and copy actions.
Scrollbars: global `scrollbar-color`, visible WebKit fallback with hover/active states, forced-colors reset. Palette maps directly to CSS; no separate theme framework.

## Do's and Don'ts

Use real project assets and CV facts. Label academic work. Avoid claiming that the existing model represents a commissioned building. In Supabase mode, keep form success tied to database completion and track email forwarding separately. In the public email-only launch, show success only when the provider accepts the enquiry; never imply a database record was saved. Honor reduced motion, pause controls, keyboard equivalents and a static architectural fallback when WebGL fails. Never put production credentials or client test fixtures in the deliverable archive.

## Evidence

User reference URL disposition: BOUNDED_EXPERIMENT, rebuilt as an independent local application. No new skill was created. First-version visual review: NEEDS_REVISION, based on the user's explicit rejection. Revised-design human comprehension review: NOT_TESTED. The user confirmed receipt of the labelled enquiry test email. Browser, API and build evidence is recorded in VERIFICATION.md.

## Pascal reference experiment · 11 October 2026

Source: https://x.com/techxsarfraj/status/2108821963494105366. Canonical source: https://github.com/pascalorg/editor (MIT license checked). Disposition: BOUNDED_EXPERIMENT. Its select/edit/level-separation/undo pattern informed an original homepage implementation. No Pascal source, packages, imagery or paid service was installed/copied. This is a compact schematic editor, not the full Pascal editor or BIM software. Construction accuracy, imported CAD, structural validation and inter-floor consistency are outside this study. Source boards stay unchanged. Human comprehension status: NOT_TESTED.

## Portfolio fidelity and three-part reveal · 11 October 2026

The current homepage uses exactly three native-scroll chapters: Landscape, Campus, Layers. The camera moves slightly; floors assemble and then separate once, with time-based damping. Scrolling beyond the third chapter leaves the pinned campus normally. Reduced motion uses discrete chapter poses with a fixed view. The reader can also choose any chapter by keyboard or pointer. The source plan stays one click away.

The model now follows the documented occupied floors: Research B and C have Ground Floor and Level 1; Research D and Academic A have Ground Floor, Level 1 and Level 2. Seven blocks contain 18 schematic floors/tier models. Room-programme descriptions are sourced to sheets 18–21. Exhibition tiers and accommodation are identified as schematic where detailed floor plans are absent. Names appear beside buildings; the third chapter labels Research D's three floors. Phone labels are limited to three landmarks for legibility; the full building and floor tree remains in the editor.

The user clarified that the strong dark green sustainability treatment was too much and the earlier pale design was more elegant. Both the section and the 29-second captioned film now use a pale paper-and-stone treatment. Green is an accent. The film uses actual portfolio drawings, slow pans and three chapters joined by gentle crossfades. It does not claim measured environmental outcomes.

The two accent techniques remain 3D material/depth and restrained motion. Procedural masonry/plaster/landscape textures are original. Free CC BY 4.0 Sketchfab planting and bench assets add context and receive visible credits at /credits. No external architecture model replaces Soham's buildings. Human review after the light-palette correction: NOT_TESTED.
