import { json } from "@/src/lib/server/http";
import { resolveMedia } from "@/src/lib/server/study-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const media = resolveMedia(
    url.searchParams.get("questionId"),
    url.searchParams.get("mediaId"),
  );
  if (!media) return json({ error: "Media not found" }, { status: 404 });

  if(!media.url.startsWith('/study/'))return json({error:'Invalid media path'},{status:404});
  return Response.redirect(new URL(media.url,url.origin),307);
}
