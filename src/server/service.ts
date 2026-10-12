import { randomUUID } from "node:crypto";
import { notifyEnquiry } from "./email";
import { ZodError, z } from "zod";
import { database, execute, query } from "./database";
import {
  checkOrigin,
  checkPassword,
  digest,
  hashPassword,
  HttpError,
  ipKey,
  jsonBody,
  limit,
  newToken,
  readBody,
} from "./security";
import { endSession, requireUser, sessionUser, startSession } from "./auth";
import { ownProject, projectDetail, createOnce } from "./repository";
import {
  activateSchema,
  inquiryEditSchema,
  inquirySchema,
  inviteSchema,
  loginSchema,
  messageSchema,
  projectEditSchema,
  projectSchema,
} from "../lib/validation";
import type { User, Project } from "../lib/domain";
import { usesEmailOnly, usesSupabase } from "./backend";
const now = () => new Date().toISOString();
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
function pageFrom(req: Request) {
  return Math.min(
    10000,
    Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1),
  );
}
export async function handle(request: Request, parts: string[]) {
  try {
    if (usesEmailOnly())
      return await (
        await import("./public-enquiries")
      ).handlePublicEnquiry(request, parts);
    if (usesSupabase())
      return await (
        await import("./supabase/service")
      ).handleSupabase(request, parts);
    const method = request.method;
    const path = parts.join("/");
    if (method !== "GET") checkOrigin(request);
    if (path === "session" && method === "GET")
      return reply({ user: await sessionUser() });
    if (path === "login" && method === "POST") {
      await limit(`login-ip:${ipKey(request)}`, 30, 15 * 60 * 1000);
      const data = loginSchema.parse(await jsonBody(request));
      await limit(`login-email:${data.email}`, 10, 15 * 60 * 1000);
      const [user] = await query<User & { password_hash: string | null }>(
        "SELECT * FROM users WHERE email=?",
        [data.email],
      );
      if (
        !(await checkPassword(data.password, user?.password_hash || null)) ||
        !user
      )
        throw new HttpError(
          401,
          "Email or password is incorrect. Please try again.",
        );
      await startSession(user.id);
      return reply({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
    if (path === "activate" && method === "POST") {
      await limit(`activate:${ipKey(request)}`, 20, 15 * 60 * 1000);
      const data = activateSchema.parse(await jsonBody(request));
      const passwordHash = await hashPassword(data.password);
      const tx = await (await database()).transaction("write");
      try {
        const row = (
          await tx.execute({
            sql: "UPDATE invitations SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>? RETURNING user_id",
            args: [Date.now(), digest(data.token), Date.now()],
          })
        ).rows[0];
        if (!row)
          throw new HttpError(
            400,
            "This invitation has expired or was already used. Ask Soham for a new invitation.",
          );
        await tx.execute({
          sql: "UPDATE users SET password_hash=? WHERE id=?",
          args: [passwordHash, row.user_id],
        });
        await tx.execute({
          sql: "DELETE FROM sessions WHERE user_id=?",
          args: [row.user_id],
        });
        await tx.execute({
          sql: "UPDATE invitations SET used_at=? WHERE user_id=? AND used_at IS NULL",
          args: [Date.now(), row.user_id],
        });
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        tx.close();
      }
      return reply({ ok: true });
    }
    if (path === "enquiries" && method === "POST") {
      await limit(`enquiry-attempt:${ipKey(request)}`, 60, 15 * 60 * 1000);
      const data = inquirySchema.parse(await jsonBody(request));
      const [previous] = await query<{ id: string }>(
        "SELECT id FROM inquiries WHERE request_key=?",
        [data.request_key],
      );
      if (previous) {
        await notifyEnquiry(previous.id).catch(() => {});
        return reply({ ok: true }, 201);
      }
      await limit(`enquiry:${ipKey(request)}`, 8, 60 * 60 * 1000);
      const id = randomUUID();
      await execute(
        `INSERT INTO inquiries(id,name,email,phone,service,client_type,location,budget,message,request_key,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING`,
        [
          id,
          data.name,
          data.email,
          data.phone,
          data.service,
          data.client_type,
          data.location,
          data.budget,
          data.message,
          data.request_key,
          now(),
        ],
      );
      const [saved] = await query<{ id: string }>(
        "SELECT id FROM inquiries WHERE request_key=?",
        [data.request_key],
      );
      await notifyEnquiry(saved.id).catch(() => {});
      return reply({ ok: true }, 201);
    }
    const user = await requireUser();
    if (path === "logout" && method === "POST") {
      await endSession();
      return reply({ ok: true });
    }
    if (path === "projects" && method === "GET") {
      const page = pageFrom(request);
      const rows = await query<Project>(
        "SELECT p.*,u.name client_name FROM projects p JOIN users u ON u.id=p.client_id WHERE (? = 'architect' OR p.client_id=?) ORDER BY p.created_at DESC LIMIT 21 OFFSET ?",
        [user.role, user.id, (page - 1) * 20],
      );
      return reply({
        items: rows.slice(0, 20),
        hasMore: rows.length > 20,
        page,
      });
    }
    if (parts[0] === "projects" && parts.length === 2 && method === "GET")
      return reply(await projectDetail(parts[1], user));
    if (
      parts[0] === "projects" &&
      parts[2] === "messages" &&
      parts.length === 3 &&
      method === "POST"
    ) {
      await ownProject(parts[1], user);
      await limit(`message:${user.id}`, 60, 60 * 60 * 1000);
      const data = messageSchema.parse(await jsonBody(request));
      await execute(
        "INSERT INTO updates(id,project_id,author_id,body,kind,request_key,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING",
        [
          randomUUID(),
          parts[1],
          user.id,
          data.body,
          user.role === "architect" ? "Studio update" : "Client message",
          data.request_key,
          now(),
        ],
      );
      return reply({ ok: true }, 201);
    }
    if (parts[0] === "documents" && parts.length === 2 && method === "GET") {
      const [file] = await query<{
        project_id: string;
        filename: string;
        mime: string;
        body: ArrayBuffer;
      }>("SELECT project_id,filename,mime,body FROM documents WHERE id=?", [
        parts[1],
      ]);
      if (!file) throw new HttpError(404, "This file is not available.");
      await ownProject(file.project_id, user);
      return new Response(new Uint8Array(file.body), {
        headers: {
          "Content-Type": file.mime,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (user.role !== "architect")
      throw new HttpError(403, "This action is available to the studio only.");
    if (path === "clients" && method === "GET")
      return reply({
        items: await query<User>(
          "SELECT id,name,email,role FROM users WHERE role='client' ORDER BY name LIMIT 100",
        ),
      });
    if (path === "invitations" && method === "POST") {
      await limit(`invite:${user.id}`, 30, 60 * 60 * 1000);
      const data = inviteSchema.parse(await jsonBody(request));
      const token = newToken();
      const tx = await (await database()).transaction("write");
      try {
        await tx.execute({
          sql: "INSERT INTO users(id,name,email,role,created_at) VALUES (?,?,?,'client',?) ON CONFLICT(email) DO NOTHING",
          args: [randomUUID(), data.name, data.email, now()],
        });
        const client = (
          await tx.execute({
            sql: "SELECT id,role FROM users WHERE email=?",
            args: [data.email],
          })
        ).rows[0];
        if (client.role !== "client")
          throw new HttpError(
            400,
            "Use a client email address for invitations.",
          );
        await tx.execute({
          sql: "DELETE FROM invitations WHERE user_id=? AND used_at IS NULL",
          args: [client.id],
        });
        await tx.execute({
          sql: "INSERT INTO invitations(token_hash,user_id,expires_at) VALUES (?,?,?)",
          args: [digest(token), client.id, Date.now() + 72 * 60 * 60 * 1000],
        });
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        tx.close();
      }
      return reply(
        {
          url: `${process.env.APP_URL || new URL(request.url).origin}/activate#${token}`,
          expires: "72 hours",
        },
        201,
      );
    }
    if (path === "projects" && method === "POST") {
      const data = projectSchema.parse(await jsonBody(request));
      const [client] = await query(
        "SELECT id FROM users WHERE id=? AND role='client'",
        [data.client_id],
      );
      if (!client) throw new HttpError(400, "Choose a client first.");
      const id = randomUUID();
      const savedId = await createOnce(
        user.id,
        data.request_key,
        "project",
        id,
        (tx) =>
          tx.execute({
            sql: "INSERT INTO projects(id,title,client_id,service,location,summary,next_step,created_at) VALUES (?,?,?,?,?,?,?,?)",
            args: [
              id,
              data.title,
              data.client_id,
              data.service,
              data.location,
              data.summary,
              data.next_step,
              now(),
            ],
          }),
      );
      return reply({ id: savedId }, 201);
    }
    if (parts[0] === "projects" && parts.length === 2 && method === "PATCH") {
      await ownProject(parts[1], user);
      const data = projectEditSchema.parse(await jsonBody(request));
      const result = await execute(
        "UPDATE projects SET stage=?,next_step=?,version=version+1 WHERE id=? AND version=?",
        [data.stage, data.next_step, parts[1], data.version],
      );
      if (!result.rowsAffected)
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
      await ownProject(parts[1], user);
      await limit(`upload:${user.id}`, 30, 60 * 60 * 1000);
      const raw = await readBody(request, 3 * 1024 * 1024 + 16384);
      const form = await new Response(new Uint8Array(raw), {
        headers: { "content-type": request.headers.get("content-type") || "" },
      }).formData();
      const requestKey = z.uuid().parse(form.get("request_key"));
      const file = form.get("file");
      const title = String(form.get("title") || "").trim();
      if (
        !(file instanceof File) ||
        file.size < 1 ||
        file.size > 3 * 1024 * 1024 ||
        title.length < 1 ||
        title.length > 180
      )
        throw new HttpError(
          400,
          "Add a title and a PDF, JPG or PNG under 3 MB.",
        );
      const buffer = Buffer.from(await file.arrayBuffer());
      const mime =
        buffer.subarray(0, 5).toString() === "%PDF-"
          ? "application/pdf"
          : buffer
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? "image/png"
            : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
              ? "image/jpeg"
              : null;
      if (!mime)
        throw new HttpError(400, "Only PDF, JPG and PNG files are accepted.");
      const filename =
        file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150) || "drawing";
      const documentId = randomUUID();
      await createOnce(
        user.id,
        requestKey,
        "document:" + parts[1],
        documentId,
        (tx) =>
          tx.execute({
            sql: "INSERT INTO documents(id,project_id,title,filename,mime,size,body,created_at) VALUES (?,?,?,?,?,?,?,?)",
            args: [
              documentId,
              parts[1],
              title,
              filename,
              mime,
              file.size,
              new Uint8Array(buffer),
              now(),
            ],
          }),
      );
      return reply({ ok: true }, 201);
    }
    if (path === "enquiries" && method === "GET") {
      const page = pageFrom(request);
      const rows = await query(
        "SELECT i.*,e.status email_status FROM inquiries i LEFT JOIN email_notifications e ON e.inquiry_id=i.id ORDER BY i.created_at DESC LIMIT 21 OFFSET ?",
        [(page - 1) * 20],
      );
      return reply({
        items: rows.slice(0, 20),
        hasMore: rows.length > 20,
        page,
      });
    }
    if (
      parts[0] === "enquiries" &&
      parts.length === 3 &&
      parts[2] === "email" &&
      method === "POST"
    ) {
      const [item] = await query("SELECT id FROM inquiries WHERE id=?", [
        parts[1],
      ]);
      if (!item)
        throw new HttpError(404, "This enquiry is no longer available.");
      await limit(`email-retry:${user.id}`, 10, 60 * 60 * 1000);
      const status = await notifyEnquiry(parts[1], true);
      return reply({ ok: true, email_status: status || "unchanged" });
    }
    if (parts[0] === "enquiries" && parts.length === 2 && method === "PATCH") {
      const data = inquiryEditSchema.parse(await jsonBody(request));
      const result = await execute("UPDATE inquiries SET status=? WHERE id=?", [
        data.status,
        parts[1],
      ]);
      if (!result.rowsAffected)
        throw new HttpError(404, "This enquiry is no longer available.");
      return reply({ ok: true });
    }
    throw new HttpError(404, "This page is not available.");
  } catch (error) {
    if (error instanceof ZodError)
      return reply(
        {
          error: "Check the highlighted fields.",
          fields: Object.fromEntries(
            error.issues.map((i) => [i.path.join("."), i.message]),
          ),
        },
        400,
      );
    if (error instanceof HttpError)
      return Response.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
            ...(error.retryAfter
              ? { "Retry-After": String(error.retryAfter) }
              : {}),
          },
        },
      );
    // No request payload, password, token, or database error is logged.
    return reply(
      {
        error:
          "We could not save this right now. Your details are still here. Please try again, or contact Soham by email.",
      },
      503,
    );
  }
}
