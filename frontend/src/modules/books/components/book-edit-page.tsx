import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { CopiesPanel } from "@/modules/book-copies/components/copies-panel";
import { getBookAdmin } from "@/modules/books/api/books-api";
import { BookForm } from "@/modules/books/components/book-form";
import { CoverImageUpload } from "@/modules/books/components/cover-image-upload";
import { useUpdateBook } from "@/modules/books/hooks/use-book-mutations";
import type { BookFormValues } from "@/modules/books/types/book";
import { ElectronicFilesPanel } from "@/modules/electronic-library/components/electronic-files-panel";

export function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useQuery({
    queryKey: ["books", "detail", id],
    queryFn: () => getBookAdmin(id!),
    enabled: !!id,
  });
  const updateBook = useUpdateBook(id!);

  async function handleSubmit(values: BookFormValues) {
    try {
      await updateBook.mutateAsync(values);
      toast.success("Kitob yangilandi");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Saqlab bo'lmadi", { description: message });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!book || !id) {
    return <p className="text-muted-foreground">Kitob topilmadi</p>;
  }

  const defaultValues: Partial<BookFormValues> = {
    title: book.title,
    originalTitle: book.original_title ?? undefined,
    isbn: book.isbn ?? undefined,
    udk: book.udk ?? undefined,
    bbk: book.bbk ?? undefined,
    publisherId: book.publisher?.id,
    publicationYear: book.publication_year ?? undefined,
    languageId: book.language?.id,
    pageCount: book.page_count ?? undefined,
    volume: book.volume ?? undefined,
    edition: book.edition ?? undefined,
    series: book.series ?? undefined,
    annotation: book.annotation ?? undefined,
    categoryId: book.category?.id,
    subjectId: book.subject?.id,
    minGrade: book.min_grade ?? undefined,
    maxGrade: book.max_grade ?? undefined,
    coverImageUrl: book.cover_image_url ?? undefined,
    downloadEnabled: book.download_enabled,
    authorIds: book.book_authors.map((a) => a.author.id),
    keywords: book.book_keywords.map((k) => k.keyword.name),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
        <p className="text-sm text-muted-foreground">Kitobni tahrirlash</p>
      </div>
      <CoverImageUpload bookId={id} coverImageUrl={book.cover_image_url} />
      <BookForm
        key={id}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateBook.isPending}
        submitLabel="O'zgarishlarni saqlash"
      />
      <CopiesPanel bookId={id} />
      <ElectronicFilesPanel bookId={id} files={book.book_files} />
    </div>
  );
}
