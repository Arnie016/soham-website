# Deployment and Supabase connection

The public website is deployed to Vercel at https://soham-khetan-studio.vercel.app using `STUDIO_BACKEND=email`. Enquiries are forwarded to Soham through FormSubmit; client sign-in clearly remains unavailable. This launch mode does not store a studio database copy and its rate/deduplication guards apply per warm server instance, not globally.

The complete Supabase implementation has passed 45 local checks. No hosted project URL/name was provided, so no remote Supabase migration or account change has been performed. Identify the exact hosted project before following the steps below. After connecting it, change `STUDIO_BACKEND` to `supabase` and redeploy.

## Deploy the public website from GitHub

Import `Arnie016/soham-website` into Vercel, select Next.js, and use the repository root. The build and install commands are in `vercel.json`.

Set production variables in Vercel:

- `APP_URL`: your full HTTPS website origin.
- `STUDIO_BACKEND`: `email` for the existing public launch.
- `EMAIL_TRANSPORT`: `formsubmit` for real enquiry delivery.
- `RATE_LIMIT_SECRET`: a newly generated private random value.

FormSubmit may require an inbox activation for a new domain. Verify delivery with the recipient before claiming the form is delivering. Never expose secret values through `NEXT_PUBLIC_` variables. The portfolio guide requires no model API key.

The GitHub repository contains source only; connecting automatic deployments to an existing Vercel project is a separate hosting setting. The existing live site need not be recreated.

## Run local Supabase

Requires Docker and the Supabase CLI, in addition to Node.js.

```sh
supabase start -x studio,realtime,imgproxy,edge-runtime,logflare,vector,supavisor
supabase migration up --local
npm run setup:supabase:local
npm run dev:supabase
```

The launcher injects the local credentials without printing them; local access details are written only into ignored `.data/`. The preview runs on port 3103. `npm run test:supabase` runs isolated test accounts with external email disabled.

## 1. Select the exact hosted project

Authenticate the Supabase CLI privately with `supabase login`, then inspect `supabase projects list` and link the intended project with `supabase link --project-ref YOUR_PROJECT_REF`.

Do not borrow another application's URL or keys. Keep secrets in the local Keychain or Vercel environment settings, never in chat, source, logs or a committed file. The project uses `sk_*` tables, a `sk_private` helper schema and the `sk-project-files` bucket to avoid generic table-name collisions.

Review both files under `supabase/migrations` and run `supabase db push --dry-run` against the selected project before applying them with `supabase db push`. The initial migration creates new application resources and will fail on an existing conflicting namespace instead of replacing it. Do not use `db reset` on a hosted project.

## 2. Server environment

| Variable                   | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `STUDIO_BACKEND`           | `supabase`                                                          |
| `SUPABASE_URL`             | Exact project API URL                                               |
| `SUPABASE_PUBLISHABLE_KEY` | Project publishable key, or legacy anon key                         |
| `SUPABASE_SECRET_KEY`      | Server secret key, or legacy service-role key; never `NEXT_PUBLIC_` |
| `APP_URL`                  | Exact HTTPS website origin, without a trailing slash                |
| `RATE_LIMIT_SECRET`        | Private random value for hashing rate-limit identifiers             |
| `EMAIL_TRANSPORT`          | `formsubmit`; `disabled` only for isolated tests                    |

Browser code uses the site's own API. The server session client uses the signed-in user's credentials for normal data/file operations, so RLS remains active. The server secret is limited in application code to public enquiry intake, notification claims, rate counters and explicitly authorised account administration.

## 3. Architect account and Auth settings

Apply migrations before running `npm run setup:supabase` with the selected project's server variables and `ADMIN_EMAIL` supplied privately.

For a new Auth account, provide `ADMIN_PASSWORD` privately with at least 12 characters. For an existing confirmed Auth account, provide its explicit `ADMIN_AUTH_USER_ID`; setup verifies the email and adds the studio profile without resetting its password. Existing architect profiles are left unchanged. Do not use this bootstrap to elevate an unrelated client.

Enable the email/password provider. Configure the website origin and allowed redirects. The local project disables public sign-up at the overall Auth level while retaining the email provider. For a shared hosted project, review global Auth changes first: uninvited Auth users already have no access to this application's RLS-protected workspace, so another application's sign-up settings need not be changed blindly.

Invitation links are generated without sending automatic email and are shared manually. Their expiry comes from the project's Auth configuration; the local default is one hour. Review password and expiry settings before launch.

## 4. Vercel

Import `soham-studio` as the project root. Use Node.js 22 or later, `npm ci`, and `npm run build`. Configure the private variables above for the intended environment. `APP_URL` must match that environment's exact origin for mutations and invitation links. Configure a chosen custom domain separately.

The private-workspace production path requires Supabase. It cannot fall back to local SQLite on Vercel. The explicit `email` launch mode forwards public enquiries and keeps private routes unavailable. Public portfolio assets are shipped with the website; private client files live in the RLS-protected Supabase bucket.

## 5. Verify on the hosted project

- Repeat the invite → set password → sign-in → project → message → drawing flow with two explicitly disposable clients.
- Test direct database and Storage requests as each client, not only the website's API. Check that cross-client reads/writes, role promotion and anonymous access fail.
- Verify cookies, HTTPS, session refresh and access after logout.
- Submit one labelled enquiry, confirm the saved record and receipt at sohamkhetan@gmail.com. If FormSubmit requests activation for the deployed origin, complete its inbox confirmation. Local inbox receipt is already confirmed; a new public domain still needs its own check.
- Establish appropriate database backups, retention and operational ownership before taking real client work.
- Ask Soham to review the content and try the revised site on his phone. Conversion and human comprehension are not established by local tests.

The test runners intentionally refuse to use a remote project. A hosted acceptance test requires explicit disposable fixtures and the selected project's scope.

## Primary references

- [Supabase server-side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage access policies](https://supabase.com/docs/guides/storage/security/access-control)
- [FormSubmit forwarding](https://formsubmit.co/ajax-documentation)
