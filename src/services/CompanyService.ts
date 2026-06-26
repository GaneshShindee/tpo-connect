import { fetchCompanies, fetchCompanyOfferingInfo } from "@/lib/tpo/api";
import { parseOfferingInfo } from "@/lib/tpo/parseOfferingInfo";
import type { CompanyOffering } from "@/types/application";

export const CompanyService = {
  list: () => fetchCompanies(),
  async getOffering(offeringId: number): Promise<CompanyOffering> {
    const data = await fetchCompanyOfferingInfo(offeringId);
    return parseOfferingInfo(data, offeringId);
  },
};