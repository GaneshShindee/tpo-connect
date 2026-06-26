import type { ApplicationPayload } from "@/types/application";

/**
 * Builds the multipart payload expected by `applytocompany_mobile`.
 * Field names are generated dynamically — never hardcode question IDs.
 */
export function buildApplicationFormData(payload: ApplicationPayload): FormData {
  const fd = new FormData();
  fd.append("companyOfferingid", String(payload.companyOfferingId));
  if (payload.cvFileId !== null && payload.cvFileId !== "") {
    fd.append("cvFile", String(payload.cvFileId));
  }
  fd.append("size", String(payload.questions.length));
  payload.questions.forEach((q, i) => {
    fd.append(`id${i}`, String(q.id));
    fd.append(`descrAnswer${i}`, payload.answers[q.id] ?? "");
  });
  return fd;
}