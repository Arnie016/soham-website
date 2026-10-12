# Soham Khetan · Architecture & Design

A visual architecture portfolio with an editable Prithvika campus, original project drawings, downloadable portfolios, project enquiries and a source-linked portfolio guide.

**Live website:** [soham-khetan-studio.vercel.app](https://soham-khetan-studio.vercel.app/)

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3100. The example configuration uses email-only mode with email delivery disabled, so local testing cannot send real enquiries. To enable delivery, follow [Deployment](docs/DEPLOYMENT.md).

## What is included

- Phone-first portfolio imagery; the editable Three.js campus loads on request on phones. Desktop retains the three-stage campus reveal.
- Nine project pages, responsive portfolio images, original PDFs and CV.
- Prithvika’s seven schematic blocks and eighteen modelled floors/tiers, with original drawing links.
- A free conversational portfolio search guide. It returns curated source extracts and links; it does not call a paid AI model or generate claims.
- Enquiry form, email and telephone actions.
- Optional invitation-only client and architect workspaces using Supabase Auth, Postgres RLS and private Storage.

**Production boundary:** the live website uses email enquiries. Hosted Supabase is not connected; private accounts require configuration. Academic proposals are not presented as completed commissions or measured environmental outcomes.

## Repository map

| Folder             | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `src/app/`         | Pages, styles and API routes                                |
| `src/components/`  | Website, campus editor and portfolio guide UI               |
| `src/content/`     | Project metadata and licensed asset provenance              |
| `src/lib/spatial/` | Campus geometry, interaction and animation                  |
| `src/lib/guide/`   | Verified portfolio knowledge and search                     |
| `src/server/`      | Validation, enquiries, authentication and repositories      |
| `public/`          | Published PDFs, images, models, fonts and film              |
| `supabase/`        | Local configuration and additive database migrations        |
| `scripts/`         | Local setup, rendering and integration checks               |
| `tests/`           | Unit and regression tests                                   |
| `docs/`            | Architecture, deployment, design and resource documentation |

## Checks

```sh
npm test
npm run typecheck
npm run build
npm run test:integration
npm run format:check
```

The integration suite creates isolated local test data and disables email. The optional `npm run test:supabase` requires the local Supabase stack; see [Deployment](docs/DEPLOYMENT.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment and backend setup](docs/DEPLOYMENT.md)
- [Resources and attribution](docs/RESOURCES.md)
- [Design notes](docs/DESIGN.md)
- [Interaction and accessibility contract](docs/UX-CONTRACT.md)
- [Verification boundaries](docs/VERIFICATION.md)

## Content and credentials

Secrets, local databases, private client files, build output and deployment credentials are excluded. Configure secrets in your hosting environment; never commit them.

Soham’s portfolio, portrait, drawings and documents remain their respective owners’ work. Their inclusion is not a grant to reuse them. Third-party models and fonts retain their own licences, documented in [Resources](docs/RESOURCES.md). No blanket open-source licence is applied to this repository.
