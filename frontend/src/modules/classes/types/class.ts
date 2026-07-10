export interface SchoolClass {
  id: string;
  grade_number: number;
  section: string;
  name: string;
  academic_year: string | null;
  homeroom_teacher: { id: string; full_name: string } | null;
}

export interface ClassFormValues {
  gradeNumber: number;
  section: string;
  homeroomTeacherId?: string;
  academicYear?: string;
}
