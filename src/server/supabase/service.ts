import { createHmac } from "node:crypto";
import { z } from "zod";
import { adminClient, userClient } from "./client";
import { supabaseOwnProject, supabaseProjectDetail } from "./repository";
import { requireUser, sessionUser } from "../auth";
import { checkOrigin, HttpError, ipKey, jsonBody, readBody } from "../security";
import { sendEnquiryEmail } from "../email";
import {
  inquirySchema,
  inquiryEditSchema,
  inviteSchema,
  loginSchema,
  messageSchema,
  projectSchema,
  projectEditSchema,
} from "@/lib/validation";
import type { Inquiry } from "@/lib/domain";

const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
function check(error: { message: string } | null) {
  if (error) throw new Error("The database operation failed.");
}
async function rate(key: string, max: number, windowMs: number) {
  const hash = createHmac(
    "sha256",
    process.env.RATE_LIMIT_SECRET || "local-development-only",
  )
    .update(key)
    .digest("hex");
  const { data, error } = await adminClient().rpc("sk_consume_rate_limit", {
    p_key: hash,
    p_now: Date.now(),
    p_window: windowMs,
  });
  check(error);
  const row = data?.[0];
  if (!row) throw new Error("Rate limit unavailable");
  if (row.count > max) {
    const seconds = Math.max(
      1,
      Math.ceil((Number(row.reset_at) - Date.now()) / 1000),
    );
    throw new HttpError(
      429,
      `Too many attempts. Try again in ${Math.ceil(seconds / 60)} minutes, or use the email link.`,
      seconds,
    );
  }
}
async function notify(id: string, retry = false) {
  const admin = adminClient();
  const claim = await admin.rpc("sk_claim_notification", {
    p_id: id,
    p_retry: retry,
  });
  check(claim.error);
  if (!claim.data) return "unchanged";
  const enquiry = await admin
    .from("sk_enquiries")
    .select("*")
    .eq("id", id)
    .single();
  check(enquiry.error);
  const status = await sendEnquiryEmail(enquiry.data as Inquiry);
  check(
    (
      await admin
        .from("sk_email_notifications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("inquiry_id", id)
    ).error,
  );
  return status;
}
export async function handleSupabase(request: Request, parts: string[]) {
  const method = request.method,
    path = parts.join("/");
  if (method !== "GET") checkOrigin(request);
  if (path === "session" && method === "GET")
    return reply({ user: await sessionUser() });
  if (path === "login" && method === "POST") {
    await rate(`login-ip:${ipKey(request)}`, 30, 900000);
    const data = loginSchema.parse(await jsonBody(request));
    await rate(`login-email:${data.email}`, 10, 900000);
    const client = await userClient();
    const result = await client.auth.signInWithPassword(data);
    if (result.error)
      throw new HttpError(
        401,
        "Email or password is incorrect. Please try again.",
      );
    const profile = await client
      .from("sk_profiles")
      .select("id,name,email,role")
      .eq("id", result.data.user.id)
      .maybeSingle();
    check(profile.error);
    if (!profile.data) {
      await client.auth.signOut({ scope: "local" });
      throw new HttpError(
        403,
        "Ask Soham for an invitation to this workspace.",
      );
    }
    return reply({ user: profile.data });
  }
  if (path === "activate" && method === "POST") {
    await rate(`activate:${ipKey(request)}`, 20, 900000);
    const data = z
      .object({
        token: z.string().regex(/^(invite|recovery):[A-Za-z0-9_-]{32,128}$/),
        password: z.string().min(12, "Use at least 12 characters.").max(128),
      })
      .parse(await jsonBody(request));
    const [kind, hash] = data.token.split(":"),
      client = await userClient();
    const verified = await client.auth.verifyOtp({
      type: kind as "invite" | "recovery",
      token_hash: hash,
    });
    if (verified.error)
      throw new HttpError(
        400,
        "This invitation has expired or was already used. Ask Soham for a new invitation.",
      );
    const profile = await client
      .from("sk_profiles")
      .select("id")
      .eq("id", verified.data.user!.id)
      .maybeSingle();
    if (!profile.data) {
      await client.auth.signOut({ scope: "local" });
      throw new HttpError(
        403,
        "This invitation is not for the studio workspace.",
      );
    }
    const updated = await client.auth.updateUser({ password: data.password });
    if (updated.error) {
      await client.auth.signOut({ scope: "local" });
      throw new HttpError(
        400,
        "The password could not be set. Ask Soham for a new invitation.",
      );
    }
    await client.auth.signOut({ scope: "global" });
    return reply({ ok: true });
  }
  if (path === "logout" && method === "POST") {
    const { error } = await (
      await userClient()
    ).auth.signOut({ scope: "local" });
    check(error);
    return reply({ ok: true });
  }
  if (path === "enquiries" && method === "POST") {
    await rate(`enquiry-attempt:${ipKey(request)}`, 60, 900000);
    const input = inquirySchema.parse(await jsonBody(request)),
      admin = adminClient();
    const previous = await admin
      .from("sk_enquiries")
      .select("id")
      .eq("request_key", input.request_key)
      .maybeSingle();
    check(previous.error);
    if (previous.data) {
      await notify(previous.data.id).catch(() => {});
      return reply({ ok: true }, 201);
    }
    await rate(`enquiry:${ipKey(request)}`, 8, 3600000);
    const { consent, website, ...data } = input;
    void consent;
    void website;
    const inserted = await admin
      .from("sk_enquiries")
      .upsert(data, { onConflict: "request_key", ignoreDuplicates: true });
    check(inserted.error);
    const saved = await admin
      .from("sk_enquiries")
      .select("id")
      .eq("request_key", input.request_key)
      .single();
    check(saved.error);
    await notify(saved.data!.id).catch(() => {});
    return reply({ ok: true }, 201);
  }
  const user = await requireUser(),
    client = await userClient();
  const page = Math.min(
    10000,
    Math.max(
      1,
      Math.floor(Number(new URL(request.url).searchParams.get("page")) || 1),
    ),
  );
  if (path === "projects" && method === "GET") {
    let query = client
      .from("sk_projects")
      .select("*,client:sk_profiles!client_id(name)");
    if (user.role === "client") query = query.eq("client_id", user.id);
    const result = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * 20, page * 20);
    check(result.error);
    const rows = (result.data || []).map(({ client: owner, ...p }) => ({
      ...p,
      client_name: owner?.name,
    }));
    return reply({ items: rows.slice(0, 20), hasMore: rows.length > 20, page });
  }
  if (parts[0] === "projects" && parts.length === 2 && method === "GET")
    return reply(await supabaseProjectDetail(parts[1]));
  if (
    parts[0] === "projects" &&
    parts[2] === "messages" &&
    parts.length === 3 &&
    method === "POST"
  ) {
    await supabaseOwnProject(parts[1]);
    await rate(`message:${user.id}`, 60, 3600000);
    const data = messageSchema.parse(await jsonBody(request));
    const result = await client.from("sk_updates").insert({
      id: data.request_key,
      project_id: parts[1],
      author_id: user.id,
      body: data.body,
    });
    if (result.error?.code === "23505") {
      const prior = await client
        .from("sk_updates")
        .select("id")
        .eq("id", data.request_key)
        .eq("project_id", parts[1])
        .eq("author_id", user.id)
        .maybeSingle();
      if (!prior.data)
        throw new HttpError(409, "Reload this project before sending again.");
    } else check(result.error);
    return reply({ ok: true }, 201);
  }
  if (parts[0] === "documents" && parts.length === 2 && method === "GET") {
    const result = await client
      .from("sk_documents")
      .select("storage_path,filename,mime")
      .eq("id", parts[1])
      .maybeSingle();
    if (result.error || !result.data)
      throw new HttpError(404, "This file is not available.");
    const file = await client.storage
      .from("sk-project-files")
      .download(result.data.storage_path);
    if (file.error || !file.data)
      throw new HttpError(404, "This file is not available.");
    return new Response(file.data, {
      headers: {
        "Content-Type": result.data.mime,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.data.filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (user.role !== "architect")
    throw new HttpError(403, "This action is available to the studio only.");
  if (path === "clients" && method === "GET") {
    const result = await client
      .from("sk_profiles")
      .select("id,name,email,role")
      .eq("role", "client")
      .order("name")
      .limit(100);
    check(result.error);
    return reply({ items: result.data });
  }
  if (path === "invitations" && method === "POST") {
    await rate(`invite:${user.id}`, 30, 3600000);
    const input = inviteSchema.parse(await jsonBody(request)),
      admin = adminClient();
    const existing = await admin
      .from("sk_profiles")
      .select("id,role")
      .eq("email", input.email)
      .maybeSingle();
    check(existing.error);
    if (existing.data?.role === "architect")
      throw new HttpError(400, "Use a client email address for invitations.");
    const kind = existing.data ? "recovery" : "invite";
    const link = await admin.auth.admin.generateLink(
      kind === "invite"
        ? {
            type: "invite",
            email: input.email,
            options: { data: { name: input.name } },
          }
        : { type: "recovery", email: input.email },
    );
    if (link.error || !link.data.user)
      throw new HttpError(
        400,
        "The invitation could not be created. Check the email address and try again.",
      );
    const byId = await admin
      .from("sk_profiles")
      .select("role")
      .eq("id", link.data.user.id)
      .maybeSingle();
    check(byId.error);
    if (byId.data?.role === "architect")
      throw new HttpError(400, "Use a client email address for invitations.");
    check(
      (
        await admin.from("sk_profiles").upsert({
          id: link.data.user.id,
          name: input.name,
          email: input.email,
          role: "client",
        })
      ).error,
    );
    return reply(
      {
        url: `${process.env.APP_URL || new URL(request.url).origin}/activate#${kind}:${link.data.properties.hashed_token}`,
        expires: "1 hour",
      },
      201,
    );
  }
  if (path === "projects" && method === "POST") {
    const { request_key, ...data } = projectSchema.parse(
      await jsonBody(request),
    );
    const owner = await client
      .from("sk_profiles")
      .select("id")
      .eq("id", data.client_id)
      .eq("role", "client")
      .maybeSingle();
    if (!owner.data) throw new HttpError(400, "Choose a client first.");
    const result = await client
      .from("sk_projects")
      .insert({ id: request_key, ...data });
    if (result.error?.code === "23505") await supabaseOwnProject(request_key);
    else check(result.error);
    return reply({ id: request_key }, 201);
  }
  if (parts[0] === "projects" && parts.length === 2 && method === "PATCH") {
    await supabaseOwnProject(parts[1]);
    const { version, ...data } = projectEditSchema.parse(
      await jsonBody(request),
    );
    const result = await client
      .from("sk_projects")
      .update(data)
      .eq("id", parts[1])
      .eq("version", version)
      .select("id");
    check(result.error);
    if (!result.data?.length)
      throw new HttpError(
        409,
        "This project changed in another window. Reload it before saving. Your text is still here.",
      );
    return reply({ ok: true });
  }
  if (
    parts[0] === "projects" &&
    parts[2] === "documents" &&
    parts.length === 3 &&
    method === "POST"
  ) {
    await supabaseOwnProject(parts[1]);
    await rate(`upload:${user.id}`, 30, 3600000);
    const raw = await readBody(request, 3 * 1024 * 1024 + 16384);
    const form = await new Response(new Uint8Array(raw), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const id = z.uuid().parse(form.get("request_key")),
      file = form.get("file"),
      title = String(form.get("title") || "").trim();
    if (
      !(file instanceof File) ||
      file.size < 1 ||
      file.size > 3145728 ||
      !title ||
      title.length > 180
    )
      throw new HttpError(400, "Add a title and a PDF, JPG or PNG under 3 MB.");
    const body = Buffer.from(await file.arrayBuffer());
    const mime =
      body.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : body
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : body[0] === 255 && body[1] === 216 && body[2] === 255
            ? "image/jpeg"
            : null;
    if (!mime)
      throw new HttpError(400, "Only PDF, JPG and PNG files are accepted.");
    const prior = await client
      .from("sk_documents")
      .select("id,project_id")
      .eq("id", id)
      .maybeSingle();
    check(prior.error);
    if (prior.data) {
      if (prior.data.project_id !== parts[1])
        throw new HttpError(409, "Reload this project before uploading again.");
      return reply({ ok: true }, 201);
    }
    const filename =
      file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150) || "drawing";
    const storage_path = `${parts[1]}/${id}/${filename}`;
    const uploaded = await client.storage
      .from("sk-project-files")
      .upload(storage_path, body, { contentType: mime, upsert: false });
    if (uploaded.error) {
      // Recover an interrupted metadata write only when the existing file is identical.
      const existing = await client.storage
        .from("sk-project-files")
        .download(storage_path);
      if (
        existing.error ||
        !existing.data ||
        !body.equals(Buffer.from(await existing.data.arrayBuffer()))
      )
        throw new HttpError(
          503,
          "The drawing could not be uploaded. Please try again.",
        );
    }
    const inserted = await client.from("sk_documents").insert({
      id,
      project_id: parts[1],
      title,
      filename,
      mime,
      size: file.size,
      storage_path,
    });
    if (inserted.error?.code !== "23505") check(inserted.error);
    return reply({ ok: true }, 201);
  }
  if (path === "enquiries" && method === "GET") {
    const result = await client
      .from("sk_enquiries")
      .select("*,notification:sk_email_notifications(status)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * 20, page * 20);
    check(result.error);
    const rows = (result.data || []).map(({ notification, ...i }) => ({
      ...i,
      email_status: notification?.status,
    }));
    return reply({ items: rows.slice(0, 20), hasMore: rows.length > 20, page });
  }
  if (
    parts[0] === "enquiries" &&
    parts[2] === "email" &&
    parts.length === 3 &&
    method === "POST"
  ) {
    const existing = await client
      .from("sk_enquiries")
      .select("id")
      .eq("id", parts[1])
      .maybeSingle();
    if (!existing.data)
      throw new HttpError(404, "This enquiry is no longer available.");
    await rate(`email-retry:${user.id}`, 10, 3600000);
    return reply({ ok: true, email_status: await notify(parts[1], true) });
  }
  if (parts[0] === "enquiries" && parts.length === 2 && method === "PATCH") {
    const data = inquiryEditSchema.parse(await jsonBody(request));
    const result = await client
      .from("sk_enquiries")
      .update(data)
      .eq("id", parts[1])
      .select("id");
    check(result.error);
    if (!result.data?.length)
      throw new HttpError(404, "This enquiry is no longer available.");
    return reply({ ok: true });
  }
  throw new HttpError(404, "This page is not available.");
}
