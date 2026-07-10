import { BookOpen, BookmarkPlus, FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import { getBook } from "@/modules/catalog/api/search-books";
import { createReservation } from "@/modules/circulation/api/create-reservation";
import { useAuthStore } from "@/stores/auth-store";

const COPY_STATUS_LABEL: Record<string, string> = {
  available: "Mavjud",
  issued: "Berilgan",
  reserved: "Bron qilingan",
  lost: "Yo'qolgan",
  under_repair: "Ta'mirda",
  withdrawn: "Chiqarilgan",
  in_transit: "Yo'lda",
};

interface BookDetailPageProps {
  loginPath: string;
}

export function BookDetailPage({ loginPath }: BookDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  const { data: book, isLoading } = useQuery({
    queryKey: ["catalog", "book", id],
    queryFn: () => getBook(id!),
    enabled: !!id,
  });

  const reserveMutation = useMutation({
    mutationFn: () => createReservation(id!),
    onSuccess: () => {
      toast.success("Kitob band qilindi", { description: "Navbatingiz keldi deb xabar beramiz." });
      queryClient.invalidateQueries({ queryKey: ["catalog", "book", id] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Band qilib bo'lmadi", { description: message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!book) {
    return <p className="text-muted-foreground">Kitob topilmadi</p>;
  }

  const availableCopies = book.book_copies.filter((c) => c.status === "available").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex h-64 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <BookOpen className="size-12 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            {book.original_title ? <p className="text-muted-foreground">{book.original_title}</p> : null}
          </div>

          {book.book_authors.length > 0 ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Muallif: </span>
              {book.book_authors.map((a) => a.author.full_name).join(", ")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {book.publisher ? <Badge variant="outline">{book.publisher.name}</Badge> : null}
            {book.publication_year ? <Badge variant="outline">{book.publication_year}</Badge> : null}
            {book.language ? <Badge variant="outline">{book.language.name}</Badge> : null}
            {book.isbn ? <Badge variant="outline">ISBN {book.isbn}</Badge> : null}
            {book.udk ? <Badge variant="outline">UDK {book.udk}</Badge> : null}
            {book.bbk ? <Badge variant="outline">BBK {book.bbk}</Badge> : null}
          </div>

          {book.annotation ? <p className="text-sm leading-relaxed">{book.annotation}</p> : null}

          {book.book_keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {book.book_keywords.map(({ keyword }) => (
                <Badge key={keyword.id} variant="secondary">
                  {keyword.name}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-2">
            {session ? (
              <Button onClick={() => reserveMutation.mutate()} disabled={reserveMutation.isPending || availableCopies > 0}>
                <BookmarkPlus className="size-4" />
                {availableCopies > 0 ? "Nusxalar mavjud" : "Navbatga yozilish"}
              </Button>
            ) : (
              <Button asChild>
                <Link to={loginPath}>Band qilish uchun tizimga kiring</Link>
              </Button>
            )}
            {book.has_pdf ? (
              <Button variant="outline" onClick={() => navigate(`/electronic-library/${book.id}`)}>
                <FileText className="size-4" />
                Onlayn o'qish
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nusxalar ({book.book_copies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {book.book_copies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu kitobning jismoniy nusxasi yo'q</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inventar</TableHead>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Joylashuv</TableHead>
                  <TableHead>Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {book.book_copies.map((copy) => (
                  <TableRow key={copy.id}>
                    <TableCell>{copy.inventory_number}</TableCell>
                    <TableCell>{copy.barcode}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {copy.rack ? `${copy.rack.shelf.location.name} / ${copy.rack.shelf.name} / ${copy.rack.name}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={copy.status === "available" ? "secondary" : "outline"}>
                        {COPY_STATUS_LABEL[copy.status] ?? copy.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
