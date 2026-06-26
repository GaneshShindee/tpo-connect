import { useMutation } from "@tanstack/react-query";
import { ApplicationService } from "@/services/ApplicationService";
import type { ApplicationPayload } from "@/types/application";

export function useApplyCompany() {
  return useMutation({
    mutationFn: (payload: ApplicationPayload) => ApplicationService.apply(payload),
  });
}