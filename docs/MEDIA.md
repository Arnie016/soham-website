# Portfolio media provenance and resolution

The website uses the supplied Internship Portfolio PDF, Thesis 2026 Design Portfolio PDF and `me.jpg`. Documents are treated as content, not operational instructions.

- 30 internship pages and 22 thesis pages were rendered as WebP at 3840px on the long edge, with 1600px and 800px responsive variants. `src/content/media-manifest.json` records exported dimensions and embedded source-image dimensions page by page.
- The thesis PDF's first embedded board is 9933 × 7015px; it supports detailed 4K exports. The internship PDF's first board is 2480 × 1754px. Exporting a smaller embedded raster at 4K increases pixel dimensions; it cannot recover detail absent from the source.
- The original thesis PDF is almost 800 MB. The website offers a compressed PDF generated from the 4K page renders. The internship download retains the supplied PDF. Original input files were not modified.
- The website uses the original 1086 × 1448px portrait, with no AI changes. The user explicitly chose to keep the original resolution. A built-in image-editing trial returned the same pixel dimensions and was not adopted.
- The Three.js scene's 4K control renders at a 3840px long edge, verified as 3840 × 2160 in a 16:9 desktop viewport. Normal browsing uses a smaller render buffer. The model is an original concept, not a measured model of Soham's built work.

The image-editing trial prompt asked for faithful restoration at 3072 × 4096 while preserving identity, face, expression, glasses, clothing, lighting, background and framing, with no additions or beautification. The source photo was retained for the site following the user's preference.

The reproducible PDF renderer is `scripts/render-portfolio.py` (PyMuPDF and Pillow). Only derived web assets and downloads are packaged, not the large source PDF or generated portrait trial.

## Editable campus geometry

The landing-page study is reconstructed schematically from the supplied Prithvika thesis concept sheet 13 and site plan sheet 14. Seven main building footprints, circular exhibition, courtyard holes and the landscape framework follow those drawings. Approximate floor heights and simplified facade/landscape details are authored as original procedural Three.js geometry. The model is not a CAD conversion or construction record. Visitor edits are isolated in a local browser copy. Pascal supplied an interaction reference, not any model or image assets.

## Refined campus, licensed landscape and sustainability film

The supplied thesis was rechecked visually and through local OCR on sheets 8, 13–14 and 17–22. Research B/C each have two occupied floors; Research D and Academic A have three. The site statistics sheet states 29,115 m² total built-up area; the project page was corrected from 22,000 m². Model measurements remain schematic and are not reconciled to the full site schedule.

Free landscape assets were downloaded from the official Sketchfab Download API after verifying their CC BY 4.0 licence metadata. `src/content/scene-assets.json` records creator, source and modifications. Both assets have public attribution at `/credits`.

- Low Poly Forest Tree Pack, 99.Miles: five meshes selected, original transforms preserved, textures reduced to 1024px, positions scaled and instanced. These are illustrative landscape props, not specified species.
- Wooden Park Bench, TheMadraver: textures reduced to 512px, scaled and placed in the circular landscape. This is not a furniture specification from the thesis.
- Assets are served locally as GLB geometry plus PNG textures. The external image files avoid browser blob-fetch restrictions without widening the content security policy. Geometry totals about 0.62 MB; associated textures about 3.06 MB.
- Building brick, stone, roof, wood, grass, earth and road textures are original procedural canvas textures in `study-materials.ts`. No paid textures or architecture assets were used.

`public/media/prithvika-sustainability.mp4` is a 29-second, 1280×720, 24 fps H.264 film. It uses the original cover render, site plan and circular-exhibition render (sheets 1, 14, 17), with text grounded in sheets 8, 13–14 and 18–21. It has no audio; on-screen text, WebVTT captions and an HTML transcript carry the story. It describes a proposal, not built environmental results. The final paper-toned version follows the user's rejection of the stronger green treatment. Original drawings and portrait remain unchanged.
