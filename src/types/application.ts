export type DynamicQuestion = {
  id: number;
  question: string;
};

export type ResumeOption = {
  id: number | string;
  name: string;
};

export type EligibilityCriterion = {
  label: string;
  value: string;
};

export type SelectionRound = {
  roundNumber?: number;
  name: string;
  date?: string;
  isFinal?: boolean;
};

export type CompanyOffering = {
  id: number;
  companyName: string;
  companyOfferingCode?: string;
  package?: string;
  minPackage?: number;
  maxPackage?: number;
  minStipend?: number;
  maxStipend?: number;
  placementType?: string;
  companyType?: string;
  industryType?: string;
  tokenStatus?: string;
  locations: string[];
  registrationStart?: string;
  registrationDeadline?: string;
  hiringProcess?: string;
  jobDescription?: string;
  degrees: string[];
  programs: string[];
  instructions: string[];
  criteria: EligibilityCriterion[];
  questions: DynamicQuestion[];
  selectionProcedure: SelectionRound[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  inchargeFaculty?: string;
  flags: Array<{ label: string; value: boolean }>;
  isCvRequired: boolean;
  resumes: ResumeOption[];
  raw: unknown;
};

export type ApplicationAnswers = Record<number, string>;

export type ApplicationPayload = {
  companyOfferingId: number;
  cvFileId: number | string | null;
  questions: DynamicQuestion[];
  answers: ApplicationAnswers;
};
