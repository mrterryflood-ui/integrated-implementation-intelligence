import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const maxDuration = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function attachmentFilename(name: string): string {
  return name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_").slice(0, 110) || "document";
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return Response.json({ error: "Invalid document ID" }, { status: 400 });
  if (!process.env.DIS_DATABASE_URL || !process.env.BLOB_READ_WRITE_TOKEN)
    return Response.json({ error: "Private retrieval unavailable" }, { status: 503 });

  try {
    const sql = neon(process.env.DIS_DATABASE_URL);
    // Ownership is enforced by FORCE RLS under transaction-local Clerk subject.
    const records = await sql.transaction([
      sql`SELECT set_config('dis.subject_id',${userId},true)`,
      sql`SELECT filename,blob_path FROM dis_documents WHERE id=${id} LIMIT 1`,
    ]);
    const document = records[1]?.[0];
    if (!document) return Response.json({ error: "Document not found" }, { status: 404 });
    const path = String(document.blob_path || "");
    if (!path.startsWith("dis/")) return Response.json({ error: "Invalid stored document" }, { status: 503 });

    const blob = await get(path, { access: "private" });
    if (!blob || blob.statusCode !== 200 || !blob.stream)
      return Response.json({ error: "Stored file unavailable" }, { status: 404 });

    return new Response(blob.stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="' + attachmentFilename(String(document.filename)) + '"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Private retrieval unavailable" }, { status: 503 });
  }
}
