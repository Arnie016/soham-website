import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execute, query } from "../src/server/database";
import { hashPassword } from "../src/server/security";
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const password = "Local test phrase only 2026!";
const adminId = randomUUID(),
  outsiderId = randomUUID(),
  email = `qa-${randomUUID()}@example.test`,
  outsiderEmail = `qa-${randomUUID()}@example.test`;
const invitedEmail = `qa-invited-${randomUUID()}@example.test`;
let projectId = "",
  docId = "",
  clientId = "";
let checks = 0;
const ok = (condition: unknown) => {
  assert.ok(condition);
  checks++;
};
async function api(
  path: string,
  method = "GET",
  body?: unknown,
  cookie = "",
  origin = base,
) {
  return fetch(base + "/api/" + path, {
    method,
    headers: {
      ...(method === "GET"
        ? {}
        : { origin, "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function login(address: string) {
  const r = await api("login", "POST", { email: address, password });
  assert.equal(r.status, 200);
  checks++;
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function main() {
  const hash = await hashPassword(password),
    now = new Date().toISOString();
  await execute(
    "INSERT INTO users(id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
    [adminId, "QA Studio", email, hash, "architect", now],
  );
  await execute(
    "INSERT INTO users(id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
    [outsiderId, "QA Other Client", outsiderEmail, hash, "client", now],
  );
  try {
    ok((await api("projects")).status === 401);
    ok(
      (
        await api(
          "login",
          "POST",
          { email, password },
          "",
          "https://other.example",
        )
      ).status === 403,
    );
    const admin = await login(email),
      other = await login(outsiderEmail);
    const inquiry = {
      name: "QA Enquiry",
      email: invitedEmail,
      phone: "",
      service: "Architecture",
      client_type: "Homeowner",
      location: "Chandrapur",
      budget: "Let’s discuss",
      message: "This is a synthetic integration test project enquiry.",
      consent: true,
      website: "",
      request_key: randomUUID(),
    };
    ok(
      (await api("enquiries", "POST", { ...inquiry, consent: false }))
        .status === 400,
    );
    for (let i = 0; i < 10; i++) {
      ok(
        (await api("enquiries", "POST", { ...inquiry, message: "" })).status ===
          400,
      );
    }
    ok((await api("enquiries", "POST", inquiry)).status === 201);
    ok((await api("enquiries", "POST", inquiry)).status === 201);
    ok(
      (
        await query("SELECT id FROM inquiries WHERE request_key=?", [
          inquiry.request_key,
        ])
      ).length === 1,
    );
    ok((await api("enquiries", "GET", undefined, other)).status === 403);
    const [savedEnquiry] = await query<{ id: string }>(
      "SELECT id FROM inquiries WHERE request_key=?",
      [inquiry.request_key],
    );
    const [notification] = await query<{ status: string; attempts: number }>(
      "SELECT status,attempts FROM email_notifications WHERE inquiry_id=?",
      [savedEnquiry.id],
    );
    ok(notification.status === "disabled");
    ok(notification.attempts === 1);
    ok(
      (await api(`enquiries/${savedEnquiry.id}/email`, "POST", {}, other))
        .status === 403,
    );
    let r = await api(
      "invitations",
      "POST",
      { name: "QA Invited Client", email: invitedEmail },
      admin,
    );
    ok(r.status === 201);
    const invitation = await r.json();
    const token = new URL(invitation.url).hash.slice(1);
    ok((await api("activate", "POST", { token, password })).status === 200);
    ok((await api("activate", "POST", { token, password })).status === 400);
    const client = await login(invitedEmail);
    clientId = String(
      (await query("SELECT id FROM users WHERE email=?", [invitedEmail]))[0].id,
    );
    const projectInput = {
      request_key: randomUUID(),
      title: "QA Courtyard House",
      client_id: clientId,
      service: "Architecture",
      location: "Chandrapur",
      summary: "A synthetic test brief, no real client data.",
      next_step: "Review the concept plan.",
    };
    r = await api("projects", "POST", projectInput, admin);
    ok(r.status === 201);
    projectId = (await r.json()).id;
    const repeatedProject = await api("projects", "POST", projectInput, admin);
    ok((await repeatedProject.json()).id === projectId);
    ok(
      (await query("SELECT id FROM projects WHERE client_id=?", [clientId]))
        .length === 1,
    );
    ok(
      (await api("projects/" + projectId, "GET", undefined, client)).status ===
        200,
    );
    ok(
      (await api("projects/" + projectId, "GET", undefined, other)).status ===
        404,
    );
    ok(
      (
        await api(
          "projects/" + projectId,
          "PATCH",
          { stage: "Concept", next_step: "Review the plan.", version: 1 },
          client,
        )
      ).status === 403,
    );
    ok(
      (
        await api(
          "projects/" + projectId,
          "PATCH",
          { stage: "Concept", next_step: "Review the plan.", version: 1 },
          admin,
        )
      ).status === 200,
    );
    ok(
      (
        await api(
          "projects/" + projectId,
          "PATCH",
          { stage: "Complete", next_step: "Stale edit.", version: 1 },
          admin,
        )
      ).status === 409,
    );
    const message = {
      body: "Please consider a more open living area.",
      request_key: randomUUID(),
    };
    ok(
      (
        await api(
          "projects/" + projectId + "/messages",
          "POST",
          message,
          client,
        )
      ).status === 201,
    );
    ok(
      (await api("projects/" + projectId + "/messages", "POST", message, other))
        .status === 404,
    );
    await api("projects/" + projectId + "/messages", "POST", message, client);
    ok(
      (await query("SELECT id FROM updates WHERE project_id=?", [projectId]))
        .length === 1,
    );
    const uploadKey = randomUUID();
    const upload = async (content: string, name: string, mime: string) => {
      const form = new FormData();
      form.set("title", "QA drawing");
      form.set("request_key", uploadKey);
      form.set("file", new Blob([content], { type: mime }), name);
      return fetch(base + "/api/projects/" + projectId + "/documents", {
        method: "POST",
        headers: { origin: base, cookie: admin },
        body: form,
      });
    };
    ok(
      (await upload("<script>bad</script>", "bad.pdf", "application/pdf"))
        .status === 400,
    );
    ok(
      (
        await upload(
          "%PDF-1.4\nQA fixture only",
          "drawing.pdf",
          "application/pdf",
        )
      ).status === 201,
    );
    ok(
      (
        await upload(
          "%PDF-1.4\nQA fixture only",
          "drawing.pdf",
          "application/pdf",
        )
      ).status === 201,
    );
    ok(
      (await query("SELECT id FROM documents WHERE project_id=?", [projectId]))
        .length === 1,
    );
    docId = String(
      (
        await query("SELECT id FROM documents WHERE project_id=?", [projectId])
      )[0].id,
    );
    ok(
      (await api("documents/" + docId, "GET", undefined, other)).status === 404,
    );
    r = await api("documents/" + docId, "GET", undefined, client);
    ok(r.status === 200);
    ok(r.headers.get("content-disposition")?.startsWith("attachment"));
    ok((await r.text()).startsWith("%PDF"));
    ok((await api("logout", "POST", {}, client)).status === 200);
    ok(
      (await api("projects/" + projectId, "GET", undefined, client)).status ===
        401,
    );
    console.log(
      `${checks} integration checks passed: invitations, authentication, enquiries, idempotency, role separation, project ownership, conflict protection and private file access.`,
    );
  } finally {
    await execute("DELETE FROM operation_keys WHERE actor_id=?", [adminId]);
    await execute("DELETE FROM documents WHERE project_id=?", [projectId]);
    await execute("DELETE FROM updates WHERE project_id=?", [projectId]);
    await execute("DELETE FROM projects WHERE id=?", [projectId]);
    await execute(
      "DELETE FROM email_notifications WHERE inquiry_id IN (SELECT id FROM inquiries WHERE email=?)",
      [invitedEmail],
    );
    await execute("DELETE FROM inquiries WHERE email=?", [invitedEmail]);
    for (const id of [adminId, outsiderId, clientId]) {
      if (!id) continue;
      await execute("DELETE FROM invitations WHERE user_id=?", [id]);
      await execute("DELETE FROM sessions WHERE user_id=?", [id]);
      await execute("DELETE FROM users WHERE id=?", [id]);
    }
  }
}
main().catch((e) => {
  console.error("Integration check failed:", e.message);
  process.exitCode = 1;
});
