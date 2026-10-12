import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!,
  key = process.env.SUPABASE_PUBLISHABLE_KEY!,
  base = process.env.APP_URL!;
if (
  new URL(url).hostname !== "127.0.0.1" ||
  new URL(url).port !== "55421" ||
  base !== "http://localhost:3112" ||
  process.env.EMAIL_TRANSPORT !== "disabled"
)
  throw new Error(
    "Supabase verification is restricted to the isolated local environment with email disabled.",
  );
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const sdk = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const run = randomUUID().slice(0, 8),
  password = randomBytes(24).toString("base64url"),
  ids: string[] = [],
  projectIds: string[] = [],
  paths: string[] = [];
const emails = {
  studio: `studio-${run}@example.test`,
  a: `client-a-${run}@example.test`,
  b: `client-b-${run}@example.test`,
};
const enquiryKey = randomUUID();
let checks = 0;
function ok(value: unknown, label: string) {
  assert.ok(value, label);
  checks++;
  console.log(`PASS ${label}`);
}
type Actor = { cookies: Map<string, string> };
const actor = (): Actor => ({ cookies: new Map() });
const cookie = (a: Actor) =>
  [...a.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
async function request(
  a: Actor,
  path: string,
  method = "GET",
  body?: unknown,
  origin = base,
) {
  const headers: Record<string, string> = { Origin: origin, Cookie: cookie(a) };
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch(base + "/api/" + path, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const part of response.headers.getSetCookie()) {
    const pair = part.split(";")[0],
      index = pair.indexOf("=");
    if (index > 0) a.cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const data = await response.json();
  return { status: response.status, data };
}
async function fixture(email: string, role: "architect" | "client") {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(created.error);
  const id = created.data.user!.id;
  ids.push(id);
  assert.ifError(
    (
      await admin
        .from("sk_profiles")
        .insert({ id, email, name: `Verification ${role}`, role })
    ).error,
  );
  return id;
}
async function main() {
  const studioId = await fixture(emails.studio, "architect"),
    bId = await fixture(emails.b, "client");
  const visitor = actor(),
    studio = actor(),
    a = actor(),
    b = actor();
  const nativeA = sdk(),
    nativeB = sdk(),
    nativeStudio = sdk(),
    anonymous = sdk();
  ok(
    (await request(visitor, "projects")).status === 401,
    "anonymous API access rejected",
  );
  ok(
    (await request(visitor, "enquiries", "POST", {}, "https://foreign.example"))
      .status === 403,
    "foreign origin rejected",
  );
  const studioLogin = await request(studio, "login", "POST", {
    email: emails.studio,
    password,
  });
  if (studioLogin.status !== 200) {
    const authProbe = await nativeStudio.auth.signInWithPassword({
      email: emails.studio,
      password,
    });
    const profileProbe = await nativeStudio
      .from("sk_profiles")
      .select("id")
      .eq("id", studioId);
    console.log({
      status: studioLogin.status,
      apiError: studioLogin.data.error,
      authError: authProbe.error?.message,
      profileError: profileProbe.error?.message,
    });
  }
  ok(studioLogin.status === 200, "Supabase password sign-in works through app");
  ok(
    [...studio.cookies.values()].some(Boolean),
    "auth cookies returned by sign-in",
  );
  const invited = await request(studio, "invitations", "POST", {
    name: "Verification client A",
    email: emails.a,
  });
  ok(
    invited.status === 201 && invited.data.url.includes("#invite:"),
    "single-use invitation generated without sending email",
  );
  const profile = await admin
    .from("sk_profiles")
    .select("id")
    .eq("email", emails.a)
    .single();
  assert.ifError(profile.error);
  const aId = profile.data!.id;
  ids.push(aId);
  const token = new URL(invited.data.url).hash.slice(1);
  const activated = await request(a, "activate", "POST", { token, password });
  if (activated.status !== 200)
    console.log({
      status: activated.status,
      error: activated.data.error,
      fields: activated.data.fields,
      tokenLength: token.length,
    });
  ok(
    activated.status === 200,
    "invited client sets password with Supabase Auth",
  );
  ok(
    (await request(actor(), "activate", "POST", { token, password })).status ===
      400,
    "invitation cannot be reused",
  );
  ok(
    (await request(a, "login", "POST", { email: emails.a, password }))
      .status === 200,
    "invited client signs in",
  );
  ok(
    (await request(b, "login", "POST", { email: emails.b, password }))
      .status === 200,
    "second client signs in",
  );
  for (const [connection, email] of [
    [nativeA, emails.a],
    [nativeB, emails.b],
    [nativeStudio, emails.studio],
  ] as const)
    assert.ifError(
      (await connection.auth.signInWithPassword({ email, password })).error,
    );
  const makeProject = (client_id: string) => ({
    request_key: randomUUID(),
    client_id,
    title: "Supabase verification project",
    service: "Architecture",
    location: "Test location",
    summary: "Synthetic project used only to verify access boundaries.",
    next_step: "Review the synthetic drawing.",
  });
  const inputA = makeProject(aId),
    inputB = makeProject(bId);
  const pA = await request(studio, "projects", "POST", inputA),
    pB = await request(studio, "projects", "POST", inputB);
  projectIds.push(inputA.request_key, inputB.request_key);
  ok(
    pA.status === 201 && pB.status === 201,
    "architect creates projects for two clients",
  );
  ok(
    (await request(studio, "projects", "POST", inputA)).data.id === pA.data.id,
    "project retry is idempotent",
  );
  ok(
    (await request(a, "projects")).data.items.length === 1,
    "client sees only assigned project",
  );
  ok(
    (await request(a, `projects/${pB.data.id}`)).status === 404,
    "cross-client project API returns not found",
  );
  ok(
    (await nativeA.from("sk_projects").select("id").eq("id", pB.data.id)).data
      ?.length === 0,
    "RLS blocks cross-client direct database reads",
  );
  ok(
    !!(await anonymous.from("sk_projects").select("id")).error,
    "anonymous database grant revoked",
  );
  ok(
    !!(
      await nativeA
        .from("sk_profiles")
        .update({ role: "architect" })
        .eq("id", aId)
    ).error,
    "clients cannot promote their profile role",
  );
  assert.ifError(
    (await nativeA.auth.updateUser({ data: { role: "architect" } })).error,
  );
  ok(
    (await nativeA.from("sk_enquiries").select("id")).data?.length === 0,
    "editable Auth metadata cannot grant architect access",
  );
  const { request_key, ...directProject } = makeProject(aId);
  ok(
    !!(
      await nativeA
        .from("sk_projects")
        .insert({ id: request_key, ...directProject })
    ).error,
    "RLS prevents client project creation",
  );
  ok(
    (await request(a, "projects", "POST", inputA)).status === 403,
    "API rejects studio actions from a client",
  );
  ok(
    !!(
      await nativeA.rpc("sk_consume_rate_limit", {
        p_key: "forged",
        p_now: 0,
        p_window: 100,
      })
    ).error,
    "service-only rate function denied to clients",
  );
  const msg = { request_key: randomUUID(), body: "A synthetic client note." };
  ok(
    (await request(a, `projects/${pA.data.id}/messages`, "POST", msg))
      .status === 201,
    "client message persists",
  );
  await request(a, `projects/${pA.data.id}/messages`, "POST", msg);
  ok(
    (await admin.from("sk_updates").select("id").eq("id", msg.request_key)).data
      ?.length === 1,
    "duplicate message does not create another record",
  );
  const forged = await nativeA.from("sk_updates").insert({
    id: randomUUID(),
    project_id: pA.data.id,
    author_id: studioId,
    body: "Forged author",
  });
  ok(!!forged.error, "RLS rejects author impersonation");
  ok(
    !!(
      await nativeA.from("sk_updates").insert({
        id: randomUUID(),
        project_id: pB.data.id,
        author_id: aId,
        body: "Cross-client note",
      })
    ).error,
    "RLS rejects cross-client messages",
  );
  ok(
    (
      await request(studio, `projects/${pA.data.id}`, "PATCH", {
        stage: "Concept",
        next_step: "Review the concept drawings.",
        version: 1,
      })
    ).status === 200,
    "architect can update project stage",
  );
  ok(
    (
      await request(studio, `projects/${pA.data.id}`, "PATCH", {
        stage: "Complete",
        next_step: "Stale update must fail.",
        version: 1,
      })
    ).status === 409,
    "optimistic version guard rejects stale edits",
  );
  const clientEdit = await nativeA
    .from("sk_projects")
    .update({ stage: "Complete" })
    .eq("id", pA.data.id)
    .select("id");
  ok(
    !!clientEdit.error || clientEdit.data?.length === 0,
    "RLS rejects direct client stage edits",
  );
  const bytes = Buffer.from(
      "%PDF-1.4\n% isolated local verification fixture\n%%EOF",
    ),
    docId = randomUUID();
  function upload(file = bytes) {
    const form = new FormData();
    form.set("request_key", docId);
    form.set("title", "Verification drawing");
    form.set(
      "file",
      new File([file], "verification.pdf", { type: "application/pdf" }),
    );
    return form;
  }
  ok(
    (
      await request(
        studio,
        `projects/${pA.data.id}/documents`,
        "POST",
        upload(),
      )
    ).status === 201,
    "architect uploads a private drawing to Supabase Storage",
  );
  ok(
    (
      await request(
        studio,
        `projects/${pA.data.id}/documents`,
        "POST",
        upload(),
      )
    ).status === 201,
    "upload retry is idempotent",
  );
  const doc = await admin
    .from("sk_documents")
    .select("storage_path")
    .eq("id", docId)
    .single();
  assert.ifError(doc.error);
  paths.push(doc.data!.storage_path);
  const ownFile = await fetch(base + "/api/documents/" + docId, {
    headers: { Cookie: cookie(a) },
  });
  ok(
    ownFile.status === 200 &&
      Buffer.from(await ownFile.arrayBuffer()).equals(bytes),
    "assigned client downloads the exact file",
  );
  ok(
    (await request(b, `documents/${docId}`)).status === 404,
    "cross-client file API returns not found",
  );
  ok(
    !(await nativeA.storage.from("sk-project-files").download(paths[0])).error,
    "private bucket allows assigned client",
  );
  ok(
    !!(await nativeB.storage.from("sk-project-files").download(paths[0])).error,
    "Storage RLS blocks a second client directly",
  );
  ok(
    !!(await anonymous.storage.from("sk-project-files").download(paths[0]))
      .error,
    "Storage RLS blocks anonymous downloads",
  );
  ok(
    !!(
      await nativeA.storage
        .from("sk-project-files")
        .upload(`${pA.data.id}/${randomUUID()}/forged.pdf`, bytes, {
          contentType: "application/pdf",
        })
    ).error,
    "clients cannot upload directly to private bucket",
  );
  const enquiry = {
    request_key: enquiryKey,
    name: "Supabase isolated verification",
    email: emails.a,
    phone: "",
    service: "Architecture",
    client_type: "Homeowner",
    location: "Test location",
    budget: "",
    message: "A synthetic enquiry. No external email should be sent.",
    consent: true,
    website: "",
  };
  let validationPassed = true;
  for (let i = 0; i < 10; i++)
    validationPassed =
      validationPassed &&
      (await request(visitor, "enquiries", "POST", { ...enquiry, message: "" }))
        .status === 400;
  ok(validationPassed, "ten invalid corrections remain validation errors");
  ok(
    (await request(visitor, "enquiries", "POST", enquiry)).status === 201,
    "valid enquiry succeeds after corrections",
  );
  await request(visitor, "enquiries", "POST", enquiry);
  const saved = await admin
    .from("sk_enquiries")
    .select("id")
    .eq("request_key", enquiryKey)
    .single();
  assert.ifError(saved.error);
  const notice = await admin
    .from("sk_email_notifications")
    .select("status,attempts")
    .eq("inquiry_id", saved.data!.id)
    .single();
  ok(
    notice.data?.status === "disabled" && notice.data.attempts === 1,
    "email adapter disabled in tests and duplicate send prevented",
  );
  ok(
    (await request(a, "enquiries")).status === 403,
    "client cannot read enquiries through API",
  );
  ok(
    (await nativeA.from("sk_enquiries").select("id")).data?.length === 0,
    "RLS hides enquiries from clients directly",
  );
  ok(
    !!(
      await anonymous
        .from("sk_enquiries")
        .insert({ request_key: randomUUID(), name: "spam" })
    ).error,
    "anonymous direct enquiry insert cannot bypass API validation",
  );
  ok(
    (await request(a, `enquiries/${saved.data!.id}/email`, "POST", {}))
      .status === 403,
    "clients cannot trigger notification retries",
  );
  ok(
    (
      await request(studio, `enquiries/${saved.data!.id}`, "PATCH", {
        status: "Contacted",
      })
    ).status === 200,
    "architect can maintain enquiry status",
  );
  const oldSession = (await nativeB.auth.getSession()).data.session!;
  const revoked = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${oldSession.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  assert.ifError((await nativeB.auth.signOut({ scope: "local" })).error);
  ok(
    (await revoked.from("sk_projects").select("id")).data?.length === 0,
    "RLS rejects an old access token after session logout",
  );
  ok(
    (await request(a, "logout", "POST", {})).status === 200 &&
      (await request(a, "projects")).status === 401,
    "app sign-out clears workspace access",
  );
  console.log(
    `Supabase: ${checks} checks passed against local Auth, Postgres RLS and private Storage.`,
  );
}
main()
  .catch((error) => {
    console.error(`Supabase verification failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (paths.length)
      await admin.storage.from("sk-project-files").remove(paths);
    if (projectIds.length)
      await admin.from("sk_projects").delete().in("id", projectIds);
    await admin.from("sk_enquiries").delete().eq("request_key", enquiryKey);
    for (const id of ids) {
      await admin.from("sk_profiles").delete().eq("id", id);
      await admin.auth.admin.deleteUser(id);
    }
    const buckets = [
      "login-ip:local",
      "activate:local",
      "enquiry-attempt:local",
      "enquiry:local",
      ...Object.values(emails).map((email) => `login-email:${email}`),
      ...ids.flatMap((id) => [
        `message:${id}`,
        `invite:${id}`,
        `upload:${id}`,
        `email-retry:${id}`,
      ]),
    ];
    const hashes = buckets.map((bucket) =>
      createHmac(
        "sha256",
        process.env.RATE_LIMIT_SECRET || "local-development-only",
      )
        .update(bucket)
        .digest("hex"),
    );
    await admin.from("sk_rate_limits").delete().in("key", hashes);
  });
