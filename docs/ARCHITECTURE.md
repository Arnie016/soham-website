# Application architecture

## Boundaries

| Layer                               | Responsibility                                                            |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `src/app`                           | Routes, metadata, server rendering and redirects                          |
| `src/components`                    | Public pages, forms, client/studio views and accessible controls          |
| `src/content`                       | Public portfolio data and media provenance                                |
| `src/lib/validation.ts`             | Shared input validation                                                   |
| `src/lib/spatial/study-scene.ts`    | Three.js scene, dirty-level geometry, raycast editing, motion and cleanup |
| `src/lib/spatial/editor-model.ts`   | Prithvika schematic data, polygon validation and bounded undo/redo        |
| `src/server/supabase/client.ts`     | Per-request user client and server-only administrative client             |
| `src/server/supabase/auth.ts`       | Auth-server identity verification and protected profile lookup            |
| `src/server/supabase/repository.ts` | Project reads under the user's RLS context                                |
| `src/server/supabase/service.ts`    | HTTP operations, validation, notifications and private files              |
| `src/proxy.ts`                      | Session refresh and no-store headers on workspace/auth/API routes         |
| `supabase/migrations`               | Tables, grants, RLS, bucket policies and server-only functions            |
| `src/server/backend.ts`             | Explicit Supabase, local or email-only launch selection                   |

The original SQLite implementation remains available for offline local continuity. Its database is preserved. It is not used as a production fallback.

## Identity and role authority

Supabase Auth owns passwords, verification links and sessions. The application stores no password hashes in its Supabase tables. HTTP-only, SameSite cookies carry the session; production HTTPS cookies are secure. Server identity is verified through Auth and the profile is read under RLS.

`sk_profiles` is the membership boundary. Users cannot insert or update their own role, and no role decision reads editable `user_metadata`. Only the protected studio invitation/bootstrap paths create membership. Invitations use Supabase's single-use token verification; the link's token stays in a fragment and is removed from the address bar when the form mounts.

The studio can create projects, post updates, maintain stages and upload drawings. Clients can read assigned projects, read their files and post their own messages. The application verifies identity before privileged work; hidden buttons are not an access boundary.

## Postgres access controls

All seven application tables enable RLS. Anonymous grants are revoked. Normal requests use the user's Supabase client, including Storage operations. The server secret is never exposed to browser code.

- Profiles: own profile or architect reads; no ordinary-user membership writes.
- Projects: own client assignment or architect reads; architect creation and limited stage/next-step updates.
- Messages: project access required; author must match the signed-in user. A trigger supplies the trusted author name, role and message kind.
- Documents: project access required; architect inserts only. Path constraints bind files to project and document IDs.
- Enquiries and notification states: architect reads; architect can update enquiry status. Public intake goes through validated server code, not anonymous table insertion.
- Rate counters and notification claim functions: service-only, with execute revoked from public/anonymous/authenticated roles.

Restrictive session policies check `auth.sessions` against the token's session ID and Auth user. This closes the otherwise valid access-token window after session logout. Security-definer helpers use a fixed empty search path and narrow grants.

## Private Storage

The `sk-project-files` bucket is private and limited to PDF/JPG/PNG files up to 3 MB. Object paths begin with the project UUID. Reads require access to that project; only architects may insert. Restrictive guards prevent a broad permissive policy from another app from exposing this bucket. Direct client updates, deletes and uploads are not allowed.

Files are downloaded through the user's storage context with attachment, no-store and `nosniff` headers. API upload checks content signatures and size. Interrupted metadata writes can be retried only against an identical existing file. Large CAD/video workflows and malware scanning are outside this implementation.

## Consistency and notification delivery

UUID request keys make project, message, enquiry and document retries idempotent. Database constraints enforce uniqueness. Stage changes compare a version; the database increments it. A stale update produces a conflict rather than overwriting newer work.

Enquiries persist before email forwarding. A notification row atomically claims a send. FormSubmit always targets sohamkhetan@gmail.com. States distinguish provider acceptance, activation, explicit failure, ambiguous network outcome and disabled test delivery. Acceptance is not a general guarantee of inbox arrival. The user confirmed one real labelled test reached the inbox.

Only architects may retry eligible explicit failures, with cooldown and rate limiting. An interrupted process may leave a send marked `sending`; inspect its outcome before retrying. Ambiguous outcomes are not automatically resent. Tests disable external delivery. Client messages and private files are not sent through the enquiry adapter.

## Operational proof boundary

45 integration checks ran against local Supabase Auth, actual Postgres RLS and private Storage. Hosted configuration, production performance, backup ownership, real-device usability and conversion remain unverified. See `VERIFICATION.md` and `DEPLOYMENT.md`.

## Public launch mode

`STUDIO_BACKEND=email` publishes the portfolio while hosted Supabase remains unconfigured. Only public enquiry forwarding and an anonymous session response are available. Account, project and private file APIs fail closed, and sign-in shows a clear contact route. The relay validates consent, origin, size and honeypot before calling the fixed FormSubmit recipient. Provider failure, activation requests and ambiguous delivery never become a success response. Bounded per-instance counters and duplicate guards reduce accidental repeats; they are not a durable outbox or distributed rate limiter. Supabase mode retains the durable outbox, distributed counters and RLS implementation.

The public ContactForm first uses the validated server relay. If that relay reports an explicit provider rejection, `enquiry-submission.ts` uses FormSubmit's documented browser AJAX endpoint with an explicit referrer policy. It does not send directly after application validation errors, rate limits, authentication/origin rejection, activation requests or ambiguous server outcomes. Direct delivery requires the provider's success acknowledgement; its activation messages are never shown as success.

## Editable public study

A browser-local, versioned schematic model has a building → floor → outline/wall hierarchy. No backend calls participate in editing. The view reads the model; changed floor signatures alone rebuild geometry. Raycast interaction writes previews and commits a drag as one history action. Polygon guards reject self-intersection, degenerate edges, escaped courtyard holes and out-of-range geometry. History retains fifty steps. Validated localStorage restores only the known campus structure and permitted materials. The JSON export is a study, not an IFC, DWG or BIM file. Camera movement, selection and presentation modes are transient. An idle, paused or reduced-motion scene avoids unnecessary GPU redraws; invisible/hidden scenes stop rendering. The original supplied drawings and any private client data are separate.
