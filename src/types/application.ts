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

export type CompanyOffering = {
  id: number;
  companyName: string;
  package?: string;
  placementType?: string;
  locations: string[];
  registrationDeadline?: string;
  hiringProcess?: string;
  degrees: string[];
  programs: string[];
  instructions: string[];
  criteria: EligibilityCriterion[];
  questions: DynamicQuestion[];
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