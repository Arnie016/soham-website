"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowLeft,
  FileText,
  Download,
  LogOut,
  Plus,
  RefreshCw,
  Check,
  Copy,
  FolderOpen,
} from "lucide-react";
import { Form, Field, DateLabel } from "./ui";
import type { User, Project, ProjectDetail, Inquiry } from "@/lib/domain";
import { services, stages, inquiryStatuses } from "@/lib/domain";
function useResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setData(null);
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok) throw new Error(value.error || "This page could not load.");
        return value;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.message || "Could not connect.");
      });
    return () => controller.abort();
  }, [url, revision]);
  return { data, error, reload: () => setRevision((v) => v + 1) };
}
function ResourceState({
  error,
  reload,
}: {
  error: string;
  reload: () => void;
}) {
  return (
    <div className="resource-state" role="status">
      {error ? (
        <>
          <p>{error}</p>
          <button className="outline-button" onClick={reload}>
            <RefreshCw size={16} />
            Try again
          </button>
        </>
      ) : (
        <p>Loading your workspace…</p>
      )}
    </div>
  );
}
export function WorkspaceShell({
  user,
  active = "projects",
  children,
}: {
  user: User;
  active?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const root = user.role === "architect" ? "/studio" : "/portal";
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/logout", { method: "POST" });
      if (!r.ok) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <header className="workspace-header">
        <Link className="wordmark" href="/">
          <span className="monogram">sk.</span>
          <span>
            Soham Khetan
            <small>
              {user.role === "architect"
                ? "STUDIO WORKSPACE"
                : "YOUR PROJECT WORKSPACE"}
            </small>
          </span>
        </Link>
        <div>
          <span className="user-name">{user.name}</span>
          <button onClick={logout} disabled={busy} className="quiet-button">
            Sign out <LogOut size={15} />
          </button>
        </div>
      </header>
      <div className="workspace-layout">
        {user.role === "architect" && (
          <nav className="workspace-nav" aria-label="Studio navigation">
            {[
              ["projects", "Projects"],
              ["enquiries", "Enquiries"],
              ["clients", "Clients"],
            ].map(([key, label]) => (
              <Link
                aria-current={active === key ? "page" : undefined}
                key={key}
                href={`${root}?tab=${key}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
        <main id="main" className="workspace-main">
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          {children}
        </main>
      </div>
      <footer className="workspace-footer">
        <span>SOHAM KHETAN · ARCHITECTURE & DESIGN</span>
        <a href="mailto:sohamkhetan@gmail.com">
          Need a hand? Email Soham <ArrowUpRight size={13} />
        </a>
      </footer>
    </>
  );
}
type List<T> = { items: T[]; hasMore: boolean; page: number };
export function Workspace({ user, tab }: { user: User; tab: string }) {
  return (
    <WorkspaceShell user={user} active={tab}>
      {tab === "enquiries" && user.role === "architect" ? (
        <Enquiries />
      ) : tab === "clients" && user.role === "architect" ? (
        <Clients />
      ) : (
        <ProjectList user={user} />
      )}
    </WorkspaceShell>
  );
}
function Pagination({
  page,
  hasMore,
  onChange,
}: {
  page: number;
  hasMore: boolean;
  onChange: (n: number) => void;
}) {
  if (page === 1 && !hasMore) return null;
  return (
    <div className="pagination">
      <button
        className="outline-button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>Page {page}</span>
      <button
        className="outline-button"
        disabled={!hasMore}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
function ProjectList({ user }: { user: User }) {
  const [page, setPage] = useState(1);
  const { data, error, reload } = useResource<List<Project>>(
    `/api/projects?page=${page}`,
  );
  const [creating, setCreating] = useState(false);
  return (
    <>
      <div className="workspace-title">
        <div>
          <span className="eyebrow">
            {user.role === "architect" ? "THE STUDIO" : "WELCOME BACK"}
          </span>
          <h1>{user.role === "architect" ? "Projects" : "Your projects"}</h1>
          <p>
            {user.role === "architect"
              ? "Keep the next step clear, from first brief to final drawings."
              : "Drawings, conversations and next steps. All in one place."}
          </p>
        </div>
        {user.role === "architect" && (
          <button className="button" onClick={() => setCreating(!creating)}>
            {creating ? "Close form" : "Create project"}
            <Plus size={16} />
          </button>
        )}
      </div>
      {creating && (
        <NewProject
          done={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {!data ? (
        <ResourceState error={error} reload={reload} />
      ) : data.items.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={34} strokeWidth={1} />
          <h2>
            {user.role === "architect"
              ? "A blank drawing board."
              : "Your project starts here."}
          </h2>
          <p>
            {user.role === "architect"
              ? "Invite a client, then create their project."
              : "Soham will add your project here. Once it’s ready, you’ll see its progress, drawings and conversations."}
          </p>
          {user.role === "architect" && (
            <Link className="text-link" href="/studio?tab=clients">
              Invite your first client <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="portal-projects">
          {data.items.map((p) => (
            <Link
              key={p.id}
              href={`${user.role === "architect" ? "/studio" : "/portal"}/projects/${p.id}`}
              className="portal-project"
            >
              <div className="project-file-icon">
                <FolderOpen strokeWidth={1} />
              </div>
              <div>
                <span className="eyebrow">
                  {p.service} · {p.location}
                </span>
                <h2>{p.title}</h2>
                <p>{user.role === "architect" ? p.client_name : p.next_step}</p>
              </div>
              <span className="status-label">{p.stage}</span>
              <ArrowUpRight size={22} />
            </Link>
          ))}
        </div>
      )}
      {data && (
        <Pagination page={page} hasMore={data.hasMore} onChange={setPage} />
      )}
    </>
  );
}
function NewProject({ done }: { done: () => void }) {
  const { data, error, reload } = useResource<{ items: User[] }>(
    "/api/clients",
  );
  if (!data) return <ResourceState error={error} reload={reload} />;
  if (!data.items.length)
    return (
      <div className="inline-panel">
        <p>Invite a client before creating their project.</p>
        <Link className="text-link" href="/studio?tab=clients">
          Go to clients <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="inline-panel">
      <h2>Create a project</h2>
      <Form
        noValidate
        endpoint="/api/projects"
        label="Create project"
        onSuccess={done}
      >
        <div className="form-grid">
          <Field name="title" label="Project name" required />
          <Field
            name="client_id"
            label="Client"
            options={data.items.map((u) => ({
              value: u.id,
              label: `${u.name} · ${u.email}`,
            }))}
          />
          <Field name="service" label="Service" options={services} />
          <Field name="location" label="Location" required />
          <Field
            name="summary"
            label="Project brief"
            type="textarea"
            required
          />
          <Field name="next_step" label="Next step" required />
        </div>
      </Form>
    </div>
  );
}
function Clients() {
  const { data, error, reload } = useResource<{ items: User[] }>(
    "/api/clients",
  );
  const [invite, setInvite] = useState("");
  const [copied, setCopied] = useState(false);
  return (
    <>
      <div className="workspace-title">
        <div>
          <span className="eyebrow">STUDIO CONTACTS</span>
          <h1>Clients</h1>
          <p>Invite a client to their own project workspace.</p>
        </div>
      </div>
      <div className="clients-layout">
        <div className="inline-panel">
          <h2>Create an invitation</h2>
          <p className="form-note">
            The invitation is for this email address only. Share it directly
            with the client. It is single-use and expires. For an existing
            client, a new invitation lets them reset their password.
          </p>
          <Form
            noValidate
            endpoint="/api/invitations"
            label="Create invitation"
            onSuccess={(d) => {
              setInvite(d.url);
              setCopied(false);
              reload();
            }}
          >
            <Field name="name" label="Client name" required />
            <Field name="email" label="Client email" type="email" required />
          </Form>
          {invite && (
            <div className="invitation-result" role="status">
              <h3>Invitation ready to share</h3>
              <p>
                No email has been sent. Copy the private link and share it with
                this client.
              </p>
              <label htmlFor="invitation-link">Private invitation link</label>
              <input id="invitation-link" readOnly value={invite} />
              <button
                className="outline-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(invite);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                {copied ? "Copied" : "Copy invitation"}
              </button>
            </div>
          )}
        </div>
        <div>
          {!data ? (
            <ResourceState error={error} reload={reload} />
          ) : data.items.length === 0 ? (
            <div className="empty-state">
              <h2>No clients yet.</h2>
              <p>Create an invitation to get started.</p>
            </div>
          ) : (
            <div className="client-list">
              {data.items.map((u) => (
                <div key={u.id}>
                  <span className="initial-avatar">{u.name[0]}</span>
                  <div>
                    <h3>{u.name}</h3>
                    <span>{u.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
function Enquiries() {
  const [page, setPage] = useState(1);
  const { data, error, reload } = useResource<List<Inquiry>>(
    `/api/enquiries?page=${page}`,
  );
  return (
    <>
      <div className="workspace-title">
        <div>
          <span className="eyebrow">NEW CONVERSATIONS</span>
          <h1>Enquiries</h1>
          <p>
            Project briefs sent through the website. Email notifications go to
            sohamkhetan@gmail.com.
          </p>
        </div>
      </div>
      {!data ? (
        <ResourceState error={error} reload={reload} />
      ) : !data.items.length ? (
        <div className="empty-state">
          <h2>Room for the next idea.</h2>
          <p>New website enquiries will appear here.</p>
        </div>
      ) : (
        <div className="enquiries-list">
          {data.items.map((i) => (
            <details key={i.id} className="enquiry-item">
              <summary>
                <span>
                  <strong>{i.name}</strong>
                  <small>
                    {i.service} · {i.location}
                  </small>
                </span>
                <span className="status-label">{i.status}</span>
                <DateLabel value={i.created_at} />
                <Plus size={17} />
              </summary>
              <div className="enquiry-body">
                <p className="preserve-lines">{i.message}</p>
                <div className="enquiry-email-state">
                  <span>
                    {(
                      {
                        submitted:
                          "Passed to email service. Inbox delivery is not verified.",
                        activation_required:
                          "Confirm the FormSubmit activation in Soham’s inbox, then retry this email.",
                        failed:
                          "Email could not be sent. Your enquiry is saved here.",
                        uncertain:
                          "Email confirmation was not received. Check the inbox before resending.",
                        disabled: "Email is disabled in this test environment.",
                        queued: "Email waiting to be sent.",
                        sending: "Email is being sent.",
                      } as Record<string, string>
                    )[i.email_status || ""] ||
                      "Email notification has not been attempted."}
                  </span>
                  {["failed", "disabled", "activation_required"].includes(
                    i.email_status || "",
                  ) && (
                    <Form
                      noValidate
                      endpoint={`/api/enquiries/${i.id}/email`}
                      label="Retry email"
                      onSuccess={reload}
                    >
                      <p className="form-note">
                        Wait at least one minute between attempts.
                      </p>
                    </Form>
                  )}
                </div>
                <dl>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${i.email}`}>{i.email}</a>
                    </dd>
                  </div>
                  {i.phone && (
                    <div>
                      <dt>Phone</dt>
                      <dd>{i.phone}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Client type</dt>
                    <dd>{i.client_type}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{i.budget || "Not specified"}</dd>
                  </div>
                </dl>
                <Form
                  noValidate
                  endpoint={`/api/enquiries/${i.id}`}
                  method="PATCH"
                  label="Save status"
                  onSuccess={reload}
                >
                  <Field
                    name="status"
                    label="Enquiry status"
                    options={inquiryStatuses}
                    defaultValue={i.status}
                  />
                </Form>
              </div>
            </details>
          ))}
        </div>
      )}
      {data && (
        <Pagination page={page} hasMore={data.hasMore} onChange={setPage} />
      )}
    </>
  );
}
export function ProjectWorkspace({ user, id }: { user: User; id: string }) {
  const {
    data: p,
    error,
    reload,
  } = useResource<ProjectDetail>(`/api/projects/${id}`);
  const root = user.role === "architect" ? "/studio" : "/portal";
  return (
    <WorkspaceShell user={user}>
      <Link className="back-link" href={root}>
        <ArrowLeft size={15} />
        All projects
      </Link>
      {!p ? (
        <ResourceState error={error} reload={reload} />
      ) : (
        <>
          <div className="workspace-title">
            <div>
              <span className="eyebrow">
                {p.service} · {p.location}
              </span>
              <h1>{p.title}</h1>
              <p>
                {user.role === "architect"
                  ? `Client: ${p.client_name}`
                  : "Your project, one considered step at a time."}
              </p>
            </div>
            <span className="status-label">{p.stage}</span>
          </div>
          <ol className="project-progress" aria-label="Project stages">
            {stages.map((s, i) => (
              <li
                key={s}
                className={i <= stages.indexOf(p.stage as any) ? "reached" : ""}
                aria-current={s === p.stage ? "step" : undefined}
              >
                <span>
                  {i < stages.indexOf(p.stage as any) ? (
                    <Check size={14} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <div className="project-workspace-grid">
            <div>
              <section className="workspace-section">
                <span className="eyebrow">THE BRIEF</span>
                <p className="project-brief preserve-lines">{p.summary}</p>
                <div className="next-step">
                  <span className="eyebrow">NEXT STEP</span>
                  <p>{p.next_step}</p>
                </div>
              </section>
              {user.role === "architect" && (
                <details className="edit-details">
                  <summary>
                    Update project stage and next step <Plus size={16} />
                  </summary>
                  <Form
                    noValidate
                    endpoint={`/api/projects/${id}`}
                    method="PATCH"
                    label="Save project update"
                    transform={(d) => ({ ...d, version: p.version })}
                    onSuccess={reload}
                  >
                    <Field
                      name="stage"
                      label="Stage"
                      options={stages}
                      defaultValue={p.stage}
                    />
                    <Field
                      name="next_step"
                      label="Next step"
                      defaultValue={p.next_step}
                      required
                    />
                  </Form>
                </details>
              )}
              <section className="workspace-section">
                <div className="workspace-section-heading">
                  <h2>Conversation</h2>
                  <span>Latest 100 messages</span>
                </div>
                <Form
                  noValidate
                  endpoint={`/api/projects/${id}/messages`}
                  label={
                    user.role === "architect"
                      ? "Post project update"
                      : "Send message"
                  }
                  onSuccess={reload}
                >
                  <Field
                    name="body"
                    label={
                      user.role === "architect"
                        ? "Update for your client"
                        : "Message to Soham"
                    }
                    type="textarea"
                    placeholder="Keep feedback and questions with the project."
                    required
                    maxLength={4000}
                  />
                </Form>
                <div className="message-list">
                  {p.updates.length === 0 ? (
                    <p className="empty-note">
                      No messages yet. Start the conversation above.
                    </p>
                  ) : (
                    p.updates.map((m) => (
                      <article className="message" key={m.id}>
                        <header>
                          <strong>{m.author_name}</strong>
                          <span>
                            {m.role === "architect" ? "Studio" : "Client"} ·{" "}
                            <DateLabel value={m.created_at} />
                          </span>
                        </header>
                        <p className="preserve-lines">{m.body}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
            <aside className="project-files">
              <div className="workspace-section-heading">
                <h2>Drawings & files</h2>
                <FileText size={21} />
              </div>
              <p className="form-note">
                Private files shared with this project.
              </p>
              {p.documents.length === 0 ? (
                <div className="file-empty">
                  <FileText size={30} strokeWidth={1} />
                  <p>No files shared yet.</p>
                </div>
              ) : (
                <div className="document-list">
                  {p.documents.map((d) => (
                    <a key={d.id} href={`/api/documents/${d.id}`}>
                      <FileText size={21} />
                      <span>
                        <strong>{d.title}</strong>
                        <small>
                          {(d.size / 1024).toFixed(0)} KB ·{" "}
                          <DateLabel value={d.created_at} />
                        </small>
                      </span>
                      <Download size={17} />
                    </a>
                  ))}
                </div>
              )}
              {user.role === "architect" && (
                <details className="upload-details">
                  <summary>
                    Share a drawing <Plus size={16} />
                  </summary>
                  <Form
                    noValidate
                    endpoint={`/api/projects/${id}/documents`}
                    label="Share file"
                    multipart
                    onSuccess={reload}
                  >
                    <Field name="title" label="Drawing title" required />
                    <label className="file-picker">
                      Choose a file
                      <input
                        name="file"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        required
                      />
                    </label>
                    <p className="form-note">
                      PDF, JPG or PNG. Up to 3 MB. Visible only to this client
                      and the studio. Check the document before sharing.
                    </p>
                  </Form>
                </details>
              )}
              <div className="workspace-help">
                <span className="eyebrow">LET’S KEEP IN TOUCH</span>
                <p>For a conversation that’s easier on a call.</p>
                <a href="tel:+919356846922">
                  +91 93568 46922 <ArrowUpRight size={15} />
                </a>
              </div>
            </aside>
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}
