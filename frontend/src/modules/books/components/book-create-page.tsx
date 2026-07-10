import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { BookForm } from "@/modules/books/components/book-form";
import { useCreateBook } from "@/modules/books/hooks/use-book-mutations";
import type { BookFormValues } from "@/modules/books/types/book";

export function BookCreatePage() {
  const navigate = useNavigate();
  const createBook = useCreateBook();

  async function handleSubmit(values: BookFormValues) {
    try {
      const book = await createBook.mutateAsync(values);
      toast.success("Kitob yaratildi");
      navigate(`/books/${book.id}/edit`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Saqlab bo'lmadi", { description: message });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yangi kitob</h1>
        <p className="text-sm text-muted-foreground">Bibliografik ma'lumotlarni kiriting</p>
      </div>
      <BookForm onSubmit={handleSubmit} isSubmitting={createBook.isPending} submitLabel="Yaratish" />
    </div>
  );
}
