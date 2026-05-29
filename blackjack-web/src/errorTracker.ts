export type ErrorAction = 'start' | 'hit' | 'stand' | 'newGame' | 'unknown';

export interface ErrorReport {
  action: ErrorAction;
  timestamp: number;
  userSaysThereIsProblem: boolean;
  details?: string;
  gameId?: string | null;
  sessionId?: string | null;
}

const STORAGE_KEY = 'blackjack_error_reports';

function readAll(): ErrorReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(reports: ErrorReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function addErrorReport(report: ErrorReport) {
  const all = readAll();
  all.push(report);
  writeAll(all);
}

export function getErrorReports(): ErrorReport[] {
  return readAll();
}

export function resetErrorReports() {
  localStorage.removeItem(STORAGE_KEY);
}

