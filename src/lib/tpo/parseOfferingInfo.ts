import type {
  CompanyOffering,
  DynamicQuestion,
  EligibilityCriterion,
  ResumeOption,
  SelectionRound,
} from "@/types/application";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function pick<T = unknown>(o: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    const hit = Object.keys(o).find((ok) => ok.toLowerCase() === k.toLowerCase());
    if (hit && o[hit] != null && o[hit] !== "") return o[hit] as T;
  }
  return undefined;
}

function pickString(o: Record<string, unknown>, keys: string[]): string | undefined {
  const v = pick(o, keys);
  return v == null ? undefined : String(v);
}

function pickNumber(o: Record<string, unknown>, keys: string[]): number | undefined {
  const v = pick(o, keys);
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function pickBool(o: Record<string, unknown>, keys: string[]): boolean {
  const v = pick(o, keys);
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function pickArray(o: Record<string, unknown>, keys: string[]): unknown[] {
  const v = pick(o, keys);
  return Array.isArray(v) ? v : [];
}

function toStringList(arr: unknown[]): string[] {
  return arr
    .map((v) => {
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (isRecord(v)) {
        return (
          pickString(v, ["name", "title", "label", "text", "value", "description"]) ??
          JSON.stringify(v)
        );
      }
      return String(v);
    })
    .filter((s) => s.trim() !== "");
}

function findRecord(data: unknown, hints: string[], depth = 0): Record<string, unknown> | null {
  if (depth > 4 || !isRecord(data)) return null;
  for (const key of Object.keys(data)) {
    if (hints.some((h) => key.toLowerCase().includes(h)) && isRecord(data[key])) {
      return data[key] as Record<string, unknown>;
    }
  }
  for (const v of Object.values(data)) {
    if (isRecord(v)) {
      const found = findRecord(v, hints, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findArray(data: unknown, hints: string[], depth = 0): unknown[] {
  if (depth > 4 || !isRecord(data)) return [];
  for (const key of Object.keys(data)) {
    if (hints.some((h) => key.toLowerCase().includes(h)) && Array.isArray(data[key])) {
      return data[key] as unknown[];
    }
  }
  for (const v of Object.values(data)) {
    if (isRecord(v)) {
      const found = findArray(v, hints, depth + 1);
      if (found.length) return found;
    }
  }
  return [];
}

export function parseOfferingInfo(data: unknown, fallbackOfferingId: number): CompanyOffering {
  const root: Record<string, unknown> = isRecord(data) ? data : {};

  // Unwrap common envelope shapes
  const inner =
    (isRecord(root.data) && (root.data as Record<string, unknown>)) ||
    (isRecord(root.result) && (root.result as Record<string, unknown>)) ||
    root;

  const offeringObj =
    findRecord(inner, ["companyoffering", "offeringdetails", "offering_info"]) ?? inner;

  const companyName =
    pickString(inner, ["company_name", "companyName", "company"]) ??
    pickString(offeringObj, ["company_name", "companyName", "company"]) ??
    "Company";

  const pkg =
    pickString(offeringObj, ["package", "ctc", "packagedetails", "salary"]) ??
    pickString(inner, ["package", "ctc"]);

  const placementType = pickString(offeringObj, [
    "placement_type",
    "placementType",
    "placementtype",
    "jobType",
    "type",
  ]) ?? pickString(inner, ["placement_type", "placementType", "placementtype"]);

  const registrationDeadline =
    pickString(offeringObj, [
      "registration_deadline",
      "registrationDeadline",
      "registrationenddate",
      "deadline",
      "lastdate",
    ]) ?? pickString(inner, ["registration_deadline", "registrationDeadline", "deadline"]);

  const hiringProcess =
    pickString(offeringObj, ["hiring_process", "hiringProcess", "hiringprocess", "rounds"]) ??
    pickString(inner, ["hiring_process", "hiringProcess", "hiringprocess"]);

  const offeringId =
    pickNumber(offeringObj, ["id", "companyOfferingId", "companyofferingid", "offeringid"]) ??
    pickNumber(inner, ["id", "companyOfferingId", "companyofferingid", "offeringid"]) ??
    fallbackOfferingId;

  const isCvRequired =
    pickBool(offeringObj, ["iscvrequired", "isCvRequired", "cvrequired", "cv_required"]) ||
    pickBool(inner, ["iscvrequired", "isCvRequired", "cvrequired", "cv_required"]);

  const locations = toStringList(
    pickArray(inner, ["locations", "location"]).length
      ? pickArray(inner, ["locations", "location"])
      : pickArray(offeringObj, ["locations", "location"]),
  );

  const degrees = toStringList(
    pickArray(inner, ["degrees", "degree", "degreelist"]).length
      ? pickArray(inner, ["degrees", "degree", "degreelist"])
      : pickArray(offeringObj, ["degrees", "degree", "degreelist"]),
  );

  const programs = toStringList(
    pickArray(inner, ["programs", "programlist", "programme"]).length
      ? pickArray(inner, ["programs", "programlist", "programme"])
      : pickArray(offeringObj, ["programs", "programlist", "programme"]),
  );

  const instructionsRaw = pickArray(inner, ["instructionlist", "instructions"]);
  const instructions = toStringList(
    instructionsRaw.length ? instructionsRaw : pickArray(offeringObj, ["instructionlist", "instructions"]),
  );

  const criteriaRaw = pickArray(inner, ["criteria", "eligibility"]).length
    ? pickArray(inner, ["criteria", "eligibility"])
    : pickArray(offeringObj, ["criteria", "eligibility"]);

  const criteria: EligibilityCriterion[] = criteriaRaw.flatMap((c) => {
    if (typeof c === "string") return [{ label: "Criteria", value: c }];
    if (!isRecord(c)) return [];
    const label =
      pickString(c, ["label", "name", "title", "criteria", "key", "field"]) ?? "Criteria";
    const value =
      pickString(c, ["value", "text", "description", "criteria_value", "criteriaValue"]) ??
      Object.entries(c)
        .filter(([k]) => !["id", "label", "name", "title", "key"].includes(k.toLowerCase()))
        .map(([, v]) => (v == null ? "" : String(v)))
        .join(" ");
    return [{ label, value: value || "—" }];
  });

  const questionsRaw = pickArray(inner, ["questions"]).length
    ? pickArray(inner, ["questions"])
    : pickArray(offeringObj, ["questions"]);

  const questions: DynamicQuestion[] = questionsRaw
    .filter(isRecord)
    .map((q) => {
      const id =
        pickNumber(q, [
          "offeringquestionquestion_id",
          "offeringQuestionQuestionId",
          "questionId",
          "question_id",
          "id",
          "qid",
        ]) ?? 0;
      const question =
        pickString(q, ["question", "questionText", "label", "title", "description"]) ??
        `Question ${id}`;
      return { id, question };
    })
    .filter((q) => q.id > 0);

  const resumesArr = findArray(root, ["cvlist", "resumelist", "cv_list", "resumes", "cvs"]);
  const resumes: ResumeOption[] = resumesArr
    .filter(isRecord)
    .map((c) => {
      const id =
        pickNumber(c, ["id", "cvId", "cv_id", "fileId", "file_id"]) ??
        pickString(c, ["id", "cvId", "cv_id", "fileId", "file_id"]) ??
        "";
      const name =
        pickString(c, ["name", "title", "fileName", "file_name", "label", "cvname"]) ?? "Resume";
      return { id, name };
    })
    .filter((c) => c.id !== "");

  // Selection procedure
  const procRaw = pickArray(inner, ["selction_procedure", "selection_procedure", "selectionProcedure", "rounds"]);
  const selectionProcedure: SelectionRound[] = procRaw.filter(isRecord).map((r) => ({
    roundNumber: pickNumber(r, ["round_number", "roundNumber", "round"]),
    name: pickString(r, ["companyround", "round_name", "name", "title"]) ?? "Round",
    date: pickString(r, ["date", "round_date", "scheduled_at"]),
    isFinal: pickBool(r, ["isfinal", "isFinal", "final"]),
  }));

  // Min/max package/stipend
  const minPackage = pickNumber(offeringObj, ["minPackage", "min_package"]) ?? pickNumber(inner, ["minpackage", "min_package"]);
  const maxPackage = pickNumber(offeringObj, ["maxPackage", "max_package"]) ?? pickNumber(inner, ["maxpackage", "max_package"]);
  const minStipend = pickNumber(offeringObj, ["minStipend", "min_stipend"]) ?? pickNumber(inner, ["minstipend"]);
  const maxStipend = pickNumber(offeringObj, ["maxStipend", "max_stipend"]) ?? pickNumber(inner, ["maxstipend"]);

  const pkgDisplay = pkg ?? (minPackage != null && maxPackage != null
    ? (minPackage === maxPackage ? `${minPackage} LPA` : `${minPackage}–${maxPackage} LPA`)
    : undefined);

  // Contact / faculty / JD / codes
  const contactName = pickString(offeringObj, ["contact_person_name", "contactPersonName"]) ?? pickString(inner, ["contact_person_name"]);
  const contactEmail = pickString(offeringObj, ["contact_email", "contactEmail"]) ?? pickString(inner, ["contact_email"]);
  const contactPhone = pickString(offeringObj, ["contact_phone", "contactPhone"]) ?? pickString(inner, ["contact_phone"]);
  const inchargeFaculty = pickString(inner, ["incharge_faculty", "inchargeFaculty"]);
  const jobDescription = pickString(offeringObj, ["job_description", "jobDescription"]) ?? pickString(inner, ["job_description"]);
  const companyOfferingCode = pickString(inner, ["companyofferingcode", "companyOfferingCode", "code"]) ?? pickString(offeringObj, ["companyofferingcode"]);
  const companyType = pickString(inner, ["companytype", "companyType"]);
  const industryType = pickString(inner, ["industrytype", "industryType"]);
  const tokenStatus = pickString(inner, ["token_status", "tokenStatus"]);
  const registrationStart = pickString(offeringObj, ["reg_start_date", "registrationStart"]);

  // Boolean flags
  const flagDefs: Array<[string, string[]]> = [
    ["Live backlog allowed", ["is_live_backlog_allowed", "isLiveBacklogAllowed"]],
    ["Dead backlog allowed", ["is_dead_backlog_allowed", "isDeadBacklogAllowed"]],
    ["Placed students allowed", ["isplacedstudentallowed", "isPlacedStudentAllowed"]],
    ["Year-down allowed", ["isyeardownallowed", "isYearDownAllowed"]],
    ["Intern students allowed", ["isinternstudentallowed", "isInternStudentAllowed"]],
    ["Higher studies allowed", ["ishigherstudiesallowed", "isHigherStudiesAllowed"]],
    ["Offer compulsory acceptable", ["isoffercomplusaryacceptable", "isOfferCompulsaryAcceptable"]],
    ["CV required", ["iscvrequired", "isCvRequired"]],
  ];
  const flags = flagDefs.map(([label, keys]) => ({
    label,
    value: pickBool(offeringObj, keys) || pickBool(inner, keys),
  }));

  return {
    id: offeringId,
    companyName,
    companyOfferingCode,
    package: pkgDisplay,
    minPackage,
    maxPackage,
    minStipend,
    maxStipend,
    placementType,
    companyType,
    industryType,
    tokenStatus,
    locations,
    registrationStart,
    registrationDeadline,
    hiringProcess,
    jobDescription,
    degrees,
    programs,
    instructions,
    criteria,
    questions,
    selectionProcedure,
    contactName,
    contactEmail,
    contactPhone,
    inchargeFaculty,
    flags,
    isCvRequired,
    resumes,
    raw: data,
  };
}