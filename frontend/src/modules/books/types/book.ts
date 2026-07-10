export interface BookFormValues {
  title: string;
  originalTitle?: string;
  isbn?: string;
  udk?: string;
  bbk?: string;
  publisherId?: string;
  publicationPlace?: string;
  publicationYear?: number;
  languageId?: string;
  pageCount?: number;
  volume?: string;
  edition?: string;
  series?: string;
  annotation?: string;
  categoryId?: string;
  subjectId?: string;
  minGrade?: number;
  maxGrade?: number;
  coverImageUrl?: string;
  downloadEnabled: boolean;
  authorIds: string[];
  keywords: string[];
}
