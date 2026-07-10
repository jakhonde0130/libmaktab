import { BookOpen, FileText } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BookSummary } from "@/modules/catalog/types/book-summary";

export function BookCard({ book, to }: { book: BookSummary; to: string }) {
  const copiesCount = book.book_copies?.[0]?.count ?? 0;

  return (
    <Link to={to}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4">
          <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="line-clamp-2 font-medium leading-snug">{book.title}</h3>
            {book.publication_year ? (
              <p className="text-sm text-muted-foreground">
                {book.publisher?.name ? `${book.publisher.name}, ` : ""}
                {book.publication_year}
              </p>
            ) : null}
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
              <Badge variant={copiesCount > 0 ? "secondary" : "outline"}>
                {copiesCount > 0 ? `${copiesCount} nusxa` : "Nusxa yo'q"}
              </Badge>
              {book.has_pdf ? (
                <Badge variant="outline" className="gap-1">
                  <FileText className="size-3" /> PDF
                </Badge>
              ) : null}
              {book.language ? <Badge variant="outline">{book.language.code.toUpperCase()}</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
