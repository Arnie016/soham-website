# Resources and attribution

Public paths are kept stable so the website, portfolio guide and PDF links work without redirects.

| Path                                         | Contents                                                  |
| -------------------------------------------- | --------------------------------------------------------- |
| `public/downloads/thesis-2026-portfolio.pdf` | Original Prithvika thesis portfolio                       |
| `public/downloads/internship-portfolio.pdf`  | Original internship/design portfolio                      |
| `public/cv/Soham-Khetan-CV.pdf`              | Supplied CV                                               |
| `public/portfolio/`                          | Original page exports and portrait assets                 |
| `public/portfolio-hd/`                       | Responsive WebP page exports at 800, 1600 and 3840 pixels |
| `public/models/`                             | Landscape models and desktop/mobile textures              |
| `public/media/`                              | Captioned sustainability film                             |
| `public/fonts/`                              | Self-hosted fonts and included licences                   |

The project metadata in `src/content/projects.json` maps projects to their sheets. The campus programme and floor descriptions are in `src/lib/spatial/prithvika-content.ts`. The guide’s curated knowledge is in `src/lib/guide/knowledge.ts`.

Third-party model provenance is recorded in `src/content/scene-assets.json` and shown at `/credits`. The tree pack and park bench are attributed CC BY 4.0 assets. Preserve attribution when redistributing modified versions. Soham’s buildings are reconstructed schematic geometry, not imported third-party architecture.

See [Media production details](MEDIA.md) for source and resolution notes. The portrait remains at its supplied resolution. PDFs are stored directly in Git; the largest is approximately 34 MB, below GitHub’s per-file limit. No Git LFS setup is required for this version.
