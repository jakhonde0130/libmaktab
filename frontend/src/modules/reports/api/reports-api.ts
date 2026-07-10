import { apiClient } from "@/lib/api-client";

export interface ClassBreakdown {
  class_name: string;
  reader_count: number;
}
export interface SubjectBreakdown {
  subject_name: string;
  book_count: number;
}
export interface YearBreakdown {
  publication_year: number;
  book_count: number;
}

export const getClassBreakdown = () =>
  apiClient.get<{ data: ClassBreakdown[] }>("/reports/class-breakdown").then((res) => res.data);
export const getSubjectBreakdown = () =>
  apiClient.get<{ data: SubjectBreakdown[] }>("/reports/subject-breakdown").then((res) => res.data);
export const getYearBreakdown = () =>
  apiClient.get<{ data: YearBreakdown[] }>("/reports/year-breakdown").then((res) => res.data);
