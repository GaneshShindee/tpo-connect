export type TpoCredentials = {
  token: string;
  uid: string;
  tenant: string;
  savedAt: number;
};

const KEY = "tpo.credentials.v1";
const STUDENT_KEY = "tpo.student.v1";
const HISTORY_KEY = "tpo.history.v1";

export function getCredentials(): TpoCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TpoCredentials) : null;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Omit<TpoCredentials, "savedAt">) {
  if (typeof window === "undefined") return;
  const full: TpoCredentials = { ...creds, savedAt: Date.now() };
  window.localStorage.setItem(KEY, JSON.stringify(full));
}

export function clearCredentials() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(STUDENT_KEY);
}

export function saveStudent(student: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
}

export function getStudent<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STUDENT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export type HistoryEntry = {
  id: string;
  companyName: string;
  companyOfferingId: number;
  timestamp: number;
  answers: Array<{ id: number; question: string; answer: string }>;
  cvFile: number | null;
  status: "success" | "failure";
  response: unknown;
};

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  const items = getHistory();
  items.unshift(entry);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 200)));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}