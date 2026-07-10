import type { SupabaseClient } from "@supabase/supabase-js";
import { circulationRepository } from "@/modules/circulation/circulation.repository.js";

const DEFAULT_LOAN_DAYS = 14;

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

export const circulationService = {
  async issue(client: SupabaseClient, bookCopyId: string, readerId: string, issuedBy: string, dueDate?: string) {
    if (dueDate) {
      return circulationRepository.issue(client, bookCopyId, readerId, issuedBy, dueDate);
    }
    const loanDays = Number(await circulationRepository.getSetting(client, "circulation.default_loan_days")) || DEFAULT_LOAN_DAYS;
    return circulationRepository.issue(client, bookCopyId, readerId, issuedBy, addDays(new Date(), loanDays));
  },
};
