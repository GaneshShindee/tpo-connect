import { useQuery } from "@tanstack/react-query";
import { CompanyService } from "@/services/CompanyService";

export function useCompanyOffering(offeringId: number) {
  return useQuery({
    queryKey: ["company-offering-info", offeringId],
    queryFn: () => CompanyService.getOffering(offeringId),
    enabled: Number.isFinite(offeringId) && offeringId > 0,
    staleTime: 30_000,
    retry: 1,
  });
}