import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Creds = {
  eps_token: string;
  eps_uid: string;
  eps_tenant: string;
  eps_userid_token: string | null;
  cv_file_id: string | null;
  api_base: string;
  companies_path: string;
  company_detail_path: string;
  apply_path: string;
};

async function loadCreds(supabase: any, userId: string): Promise<Creds> {
  const { data, error } = await supabase
    .from("tpo_credentials")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("NO_CREDENTIALS");
  return data as Creds;
}

function buildHeaders(c: Creds, extra: Record<string, string> = {}): HeadersInit {
  const h: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "EPS-token": c.eps_token,
    "EPS-uid": c.eps_uid,
    "EPS-tenant": c.eps_tenant,
    origin: "https://tpo.vierp.in",
    referer: "https://tpo.vierp.in/",
    ...extra,
  };
  if (c.eps_userid_token) h["EPS-userid-token"] = c.eps_userid_token;
  return h;
}

export const getMyCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context as any).supabase
      .from("tpo_credentials")
      .select("*")
      .eq("user_id", (context as any).userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<Creds>) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const payload = { ...data, user_id: ctx.userId };
    const { error } = await ctx.supabase
      .from("tpo_credentials")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const fetchCompanies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pathOverride?: string; method?: string; body?: any }) => d ?? {})
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const c = await loadCreds(ctx.supabase, ctx.userId);
    const path = data.pathOverride || c.companies_path;
    const url = c.api_base.replace(/\/$/, "") + path;
    const method = (data.method || "GET").toUpperCase();
    const init: RequestInit = { method, headers: buildHeaders(c, method === "GET" ? {} : { "content-type": "application/json;charset=UTF-8" }) };
    if (method !== "GET" && data.body != null) init.body = JSON.stringify(data.body);
    const res = await fetch(url, init);
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, ok: res.ok, data: json };
  });

export const fetchCompanyDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string | number; pathOverride?: string; method?: string }) => d)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const c = await loadCreds(ctx.supabase, ctx.userId);
    const base = c.api_base.replace(/\/$/, "");
    const path = data.pathOverride || c.company_detail_path;
    const url = `${base}${path}${path.includes("?") ? "&" : "/"}${data.id}`.replace(/\/\//g, "/").replace(":/", "://");
    // simpler: append /id if no placeholder
    const finalUrl = path.includes("{id}")
      ? base + path.replace("{id}", String(data.id))
      : `${base}${path.endsWith("/") ? path : path + "/"}${data.id}`;
    const res = await fetch(finalUrl, { method: (data.method || "GET").toUpperCase(), headers: buildHeaders(c) });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, ok: res.ok, url: finalUrl, data: json };
  });

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      companyOfferingId: string;
      companyName?: string;
      size?: number;
      cvFile?: string;
      answers: Array<{ id: string | number; answer: string }>;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    const c = await loadCreds(ctx.supabase, ctx.userId);
    const url = c.api_base.replace(/\/$/, "") + c.apply_path;

    const form = new FormData();
    form.append("size", String(data.size ?? data.answers.length));
    const cv = data.cvFile || c.cv_file_id || "";
    if (cv) form.append("cvFile", cv);
    form.append("companyOfferingid", String(data.companyOfferingId));
    data.answers.forEach((a, i) => {
      form.append(`id${i}`, String(a.id));
      form.append(`descrAnswer${i}`, a.answer ?? "");
    });

    const res = await fetch(url, { method: "POST", headers: buildHeaders(c), body: form });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    await ctx.supabase.from("applications").insert({
      user_id: ctx.userId,
      company_offering_id: String(data.companyOfferingId),
      company_name: data.companyName ?? null,
      answers: data.answers,
      status: res.ok ? "submitted" : "failed",
      tpo_response: json,
    });

    return { status: res.status, ok: res.ok, data: json };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    const { data, error } = await ctx.supabase
      .from("applications")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
