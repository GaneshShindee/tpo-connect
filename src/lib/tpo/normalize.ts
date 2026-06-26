/**
 * The TPO endpoints don't have a documented schema, so we defensively
 * walk the response to find the relevant data.
 */

export type CompanyRow = {
  id: number;
  name: string;
  package?: string;
  deadline?: string;
  eligibility?: string;
  status?: string;
  raw: Record<string, unknown>;
};

function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.values(v as Record<string, unknown>);
  return [];
}

function findFirstArray(data: unknown, depth = 0): unknown[] | null {
  if (depth > 4 || data == null) return null;
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === "object") return data;
    return null;
  }
  if (typeof data === "object") {
    // Prefer keys that look like data containers
    const preferred = ["data", "companies", "rows", "result", "list", "items"];
    const obj = data as Record<string, unknown>;
    for (const k of preferred) {
      if (k in obj) {
        const found = findFirstArray(obj[k], depth + 1);
        if (found) return found;
      }
    }
    for (const v of Object.values(obj)) {
      const found = findFirstArray(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function pickString(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const found = Object.keys(o).find((ok) => ok.toLowerCase() === k.toLowerCase());
    if (found && o[found] != null && o[found] !== "") return String(o[found]);
  }
  return undefined;
}

function pickNumber(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const found = Object.keys(o).find((ok) => ok.toLowerCase() === k.toLowerCase());
    if (found && o[found] != null && o[found] !== "") {
      const n = Number(o[found]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

export function extractCompanies(data: unknown): CompanyRow[] {
  const arr = findFirstArray(data) ?? [];
  return arr
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r, i) => {
      const id =
        pickNumber(r, ["companyOfferingId", "offeringId", "offering", "id", "companyOfferingid"]) ?? i;
      const name =
        pickString(r, ["companyName", "company", "name", "companyname"]) ?? "Untitled company";
      const pkg = pickString(r, ["package", "ctc", "packageDetails", "salary"]);
      const deadline = pickString(r, [
        "registrationDeadline",
        "deadline",
        "registrationEndDate",
        "endDate",
        "registrationLastDate",
      ]);
      const eligibility = pickString(r, ["eligibility", "eligibilityCriteria", "criteria"]);
      const status = pickString(r, ["status", "applicationStatus", "applied"]);
      return { id, name, package: pkg, deadline, eligibility, status, raw: r };
    });
}

export type StudentSummary = { name?: string; fields: Record<string, unknown> };

export function pickStudentSummary(data: unknown): StudentSummary {
  if (!data || typeof data !== "object") return { fields: {} };
  const obj = data as Record<string, unknown>;
  // Search for a likely "studentInfo"-style object
  function walk(d: unknown, depth = 0): Record<string, unknown> | null {
    if (depth > 3 || !d || typeof d !== "object") return null;
    const o = d as Record<string, unknown>;
    const keys = Object.keys(o).map((k) => k.toLowerCase());
    if (keys.some((k) => k.includes("studentname") || k === "name" || k === "fullname")) {
      return o;
    }
    for (const v of Object.values(o)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const found = walk(v, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }
  const found = walk(obj) ?? obj;
  const name = pickString(found, ["studentName", "name", "fullName", "firstName"]);
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(found)) {
    if (v == null || typeof v === "object") continue;
    fields[k] = v;
  }
  return { name, fields };
}

export type DynamicQuestion = {
  id: number;
  question: string;
  type: "text" | "textarea" | "dropdown";
  required: boolean;
  options?: string[];
};

export type OfferingDetail = {
  jobDescription?: string;
  hiringProcess?: string;
  eligibility?: string;
  attachments: Array<{ id: number; name: string }>;
  questions: DynamicQuestion[];
  cvOptions: Array<{ id: number | string; name: string }>;
  raw: unknown;
};

function findArrayByKey(data: unknown, keyHints: string[], depth = 0): unknown[] | null {
  if (depth > 5 || !data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    if (keyHints.some((h) => key.toLowerCase().includes(h.toLowerCase()))) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      const found = findArrayByKey(v, keyHints, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export function extractOfferingDetail(data: unknown): OfferingDetail {
  const questionsArr = findArrayByKey(data, ["question", "dynamic"]) ?? [];
  const cvArr = findArrayByKey(data, ["cv", "resume"]) ?? [];
  const attachmentsArr = findArrayByKey(data, ["attachment", "file"]) ?? [];

  const questions: DynamicQuestion[] = questionsArr
    .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
    .map((q) => {
      const id = pickNumber(q, ["id", "questionId", "qid"]) ?? 0;
      const question =
        pickString(q, ["question", "questionText", "description", "title", "label"]) ?? `Question ${id}`;
      const typeStr = (pickString(q, ["type", "questionType", "controlType"]) ?? "text").toLowerCase();
      let type: DynamicQuestion["type"] = "text";
      if (typeStr.includes("area") || typeStr.includes("multi") || typeStr.includes("long")) type = "textarea";
      else if (typeStr.includes("drop") || typeStr.includes("select") || typeStr.includes("list")) type = "dropdown";
      const required =
        Boolean(q.required) ||
        Boolean(q.isRequired) ||
        Boolean(q.mandatory) ||
        String(pickString(q, ["required", "isRequired", "mandatory"])).toLowerCase() === "true";
      const optsRaw = (q.options || q.choices || q.values) as unknown;
      let options: string[] | undefined;
      if (Array.isArray(optsRaw)) {
        options = optsRaw.map((o) =>
          typeof o === "string"
            ? o
            : pickString((o ?? {}) as Record<string, unknown>, ["label", "name", "text", "value"]) ?? String(o),
        );
      } else if (typeof optsRaw === "string" && optsRaw.includes(",")) {
        options = optsRaw.split(",").map((s) => s.trim());
      }
      return { id, question, type, required, options };
    });

  const cvOptions = cvArr
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      id: pickNumber(c, ["id", "cvId", "fileId"]) ?? pickString(c, ["id", "cvId", "fileId"]) ?? "",
      name: pickString(c, ["name", "title", "fileName", "label"]) ?? "Resume",
    }))
    .filter((c) => c.id !== "");

  const attachments = attachmentsArr
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .map((a) => ({
      id: pickNumber(a, ["id", "attachmentId", "fileId"]) ?? 0,
      name: pickString(a, ["name", "title", "fileName", "label"]) ?? "Attachment",
    }));

  function deepFindString(d: unknown, hints: string[], depth = 0): string | undefined {
    if (depth > 4 || !d || typeof d !== "object") return undefined;
    const o = d as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      if (hints.some((h) => k.toLowerCase().includes(h))) {
        const v = o[k];
        if (typeof v === "string" && v.trim()) return v;
      }
    }
    for (const v of Object.values(o)) {
      const found = deepFindString(v, hints, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  return {
    jobDescription: deepFindString(data, ["jobdescription", "jd", "description"]),
    hiringProcess: deepFindString(data, ["hiringprocess", "process", "rounds"]),
    eligibility: deepFindString(data, ["eligibility", "criteria"]),
    attachments,
    questions,
    cvOptions,
    raw: data,
  };
}