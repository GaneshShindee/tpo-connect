import { createFileRoute } from "@tanstack/react-router";

const TPO_BASE = "https://tpoapi.vierp.in";

const FORWARD_HEADERS = ["eps-token", "eps-uid", "eps-tenant", "content-type", "router-path"];

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const path = params._splat ?? "";
  const url = `${TPO_BASE}/${path}`;
  const headers = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Accept", "application/json, text/plain, */*");
  headers.set("Referer", "https://tpo.vierp.in/");
  headers.set("Origin", "https://tpo.vierp.in");

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) init.body = buf;
  }

  try {
    const res = await fetch(url, init);
    const body = await res.arrayBuffer();
    const respHeaders = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) respHeaders.set("content-type", ct);
    return new Response(body, { status: res.status, headers: respHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Proxy request failed", message: (err as Error).message }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/tpo/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PUT: proxy,
      DELETE: proxy,
    },
  },
});