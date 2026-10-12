# Workspace interaction contract

Business authority: the user's request for a client sign-in/project portal, separate architect access, enquiry email delivery and a 3D-first visual overhaul. Implementation policy is recorded in ARCHITECTURE.md. No billing, self-registration or destructive deletion flow is in scope.

| Capability     | Canonical owner                     | Source of truth | Allowed variants                 | Verification               |
| -------------- | ----------------------------------- | --------------- | -------------------------------- | -------------------------- |
| Form           | src/components/ui.tsx               | this contract   | JSON or multipart                | browser and API checks     |
| Select/Listbox | Field in ui.tsx                     | this contract   | native platform-owned popup      | keyboard and mobile checks |
| Scrollbar      | src/app/globals.css                 | DESIGN.md       | no per-panel theme               | rendered style             |
| Toast          | Form inline live region             | this contract   | error or success                 | browser feedback           |
| CRUD           | server/service.ts and workspace.tsx | ARCHITECTURE.md | create/read/update, no delete UI | tests/integration.ts       |
| Date           | DateLabel in ui.tsx                 | this contract   | display only, en-IN Asia/Kolkata | explicit timezone          |

No existing application or sibling components were supplied. These shared owners are the initial canonical system.

- Public enquiry records only name/contact, service, client category, project location, optional budget and brief. A consent checkbox explains contact use.
- Saved enquiries forward to the studio's fixed email address through FormSubmit. Provider acceptance is distinct from inbox receipt. The studio sees notification status separately and may retry eligible failures. Client project files and messages are not forwarded by this adapter.
- Sign-in is invitation-only. Public visitors cannot assign themselves a studio role. Architects manage clients and projects; clients only read and comment on assigned projects. Supabase RLS and server authorization enforce this policy.
- Invitation creation returns a private link for manual sharing. It never claims email delivery. The link is single-use and expires according to the configured backend; local Supabase defaults to one hour. Existing-client redemption resets the password and revokes previous sessions. The fragment keeps the token out of request paths and referrers.
- Native select controls intentionally use OS popup geometry. Dates are display-only, not editable calendar inputs.
- Form → disable duplicate submit → persist to server → update view or show success. On failure keep input and show inline text. Validation focuses the first invalid field and associates text with inputs. Do not store passwords or private messages in localStorage.
- Idempotency keys protect enquiry, message, project and file retries. New invitations replace earlier unused invitations for the same email without duplicating client accounts. Forms prevent duplicate in-flight submissions.
- List pagination uses explicit 20-item pages. Messages and file lists show latest 100; client selection supports first 100 clients. Larger portfolios of clients need search/pagination before expansion.
- Project phase updates use a version check to reject stale edits. Stage selection and next-step copy are maintained together. Refresh before resolving a conflict.
- Lightbox uses native modal dialog focus management, Escape to close and restoration to originating drawing. Navigation is a non-modal mobile menu.
- Forms do not autosave. App-owned confirmation guards in-app links when there are unsaved changes; beforeunload guards page closure. No sensitive drafts are persisted in the browser. Browser back/forward navigation is not intercepted.
- Empty state explains the next action. Errors never claim success. Session expiry displays sign-in guidance while preserving the currently mounted form.
- No actual human comprehension test has been observed. Status NOT_TESTED.

## Public editable campus study

The visitor edits a schematic copy of the supplied Prithvika campus. No client portal, server record or original portfolio is changed. `editor-model.ts` is the data/history/validation owner; `study-scene.ts` only renders and translates pointer intent; the homepage owns labelled controls, local save and download. Changes save under one versioned localStorage key and are never sent to the server. Malformed or obsolete saves are ignored. A reset is undoable. Keyboard controls duplicate material, size, height, wall movement, floor isolation and camera actions. Undo/redo use Ctrl/Cmd Z and Shift Ctrl/Cmd Z within the editor; text inputs keep their native behavior. Escape exits editing. Export is a clearly named JSON study file, not CAD or construction documentation. Human comprehension: NOT_TESTED.

## Three-part campus story and sustainability film

Native scroll drives one finite Landscape → Campus → Layers progression, then the page continues normally. Chapter buttons provide an equivalent action. Reduced motion uses discrete poses; there is no automatic orbit. Clicking a building label opens its Ground Floor in the editor; Research D floor labels open that exact floor. Labels can be hidden. The editor remains an independent local copy with source-sheet links.

Model schema v2 corrects floor counts to the thesis. It uses a new browser key; previous v1 saved data is left untouched and is not silently reinterpreted. Reset affects the new study only.

The header's Sustainability action and hero film action open a native modal with an actual 29-second video, native play/pause/seek/fullscreen controls, captions and a written transcript. Playback starts only after the visitor requests it. Escape and Close pause the film, restore focus and unlock page scrolling. On a small-screen closed menu, focus returns to the menu button. A video failure exposes a direct video link and transcript. The section distinguishes design proposals from measured results.
