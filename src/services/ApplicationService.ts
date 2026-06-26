import { tpoPostForm } from "@/lib/tpo/api";
import { buildApplicationFormData } from "@/lib/tpo/buildApplicationFormData";
import type { ApplicationPayload } from "@/types/application";

export const ApplicationService = {
  async apply(payload: ApplicationPayload) {
    const fd = buildApplicationFormData(payload);
    return tpoPostForm<Record<string, unknown>>(
      "StudentApplicationTrack/applytocompany_mobile",
      fd,
      "/student-cvdynamic",
    );
  },
};