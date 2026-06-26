import { getCredentials } from "./credentials";

const BASE = "/api/tpo";

function authHeaders(routerPath: string): HeadersInit {
  const creds = getCredentials();
  if (!creds) throw new Error("Not authenticated");
  return {
    "EPS-token": creds.token,
    "EPS-uid": creds.uid,
    "EPS-tenant": creds.tenant,
    "router-path": routerPath,
  };
}

export async function tpoPostJson<T = unknown>(
  path: string,
  body: unknown,
  routerPath = "/home",
): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: {
      ...authHeaders(routerPath),
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function tpoPostForm<T = unknown>(
  path: string,
  form: FormData,
  routerPath = "/home",
): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: authHeaders(routerPath),
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function loginValidate() {
  return tpoPostJson<Record<string, unknown>>(
    "Report/studentRegistrationDashboard",
    undefined,
    "/home",
  );
}

export async function fetchCompanies() {
  return tpoPostJson<Record<string, unknown>>(
    "TPOCompanyScheduling/newschedulesdcopanies",
    undefined,
    "/company-dashboard",
  );
}

export async function fetchCompanyOffering(offering: number) {
  return tpoPostJson<Record<string, unknown>>(
    "TPOCompanyScheduling/getCompanyOfferingForFileAttachment",
    { offering },
    "/company-info",
  );
}

export async function fetchCompanyOfferingInfo(offering: number) {
  return tpoPostJson<Record<string, unknown>>(
    "TPOCompanyScheduling/CompanyofferingInfo",
    { offering },
    "/company-info",
  );
}

export type ApplyPayload = {
  companyOfferingid: number;
  cvFile: number | string;
  questions: Array<{ id: number; answer: string }>;
};

export async function applyToCompany(payload: ApplyPayload) {
  const fd = new FormData();
  fd.append("companyOfferingid", String(payload.companyOfferingid));
  fd.append("cvFile", String(payload.cvFile));
  fd.append("size", String(payload.questions.length));
  payload.questions.forEach((q, i) => {
    fd.append(`id${i}`, String(q.id));
    fd.append(`descrAnswer${i}`, q.answer);
  });
  return tpoPostForm<Record<string, unknown>>(
    "StudentApplicationTrack/applytocompany_mobile",
    fd,
    "/student-cvdynamic",
  );
}