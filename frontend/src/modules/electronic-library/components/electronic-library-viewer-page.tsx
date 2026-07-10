import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBook } from "@/modules/catalog/api/search-books";
import { getDownloadUrl, getViewUrl } from "@/modules/electronic-library/api/electronic-library-api";

export function ElectronicLibraryViewerPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const { data: book, isLoading } = useQuery({
    queryKey: ["catalog", "book", bookId],
    queryFn: () => getBook(bookId!),
    enabled: !!bookId,
  });

  async function openViewer(fileId: string) {
    const { url } = await getViewUrl(fileId);
    setActiveFileId(fileId);
    setViewerUrl(url);
  }

  async function download(fileId: string) {
    const { url } = await getDownloadUrl(fileId);
    window.open(url, "_blank");
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!book) {
    return <p className="text-muted-foreground">Kitob topilmadi</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{book.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {book.book_files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Elektron fayl mavjud emas</p>
          ) : (
            book.book_files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between rounded-md border p-2 ${
                  activeFileId === file.id ? "border-primary" : ""
                }`}
              >
                <button
                  className="flex flex-1 items-center gap-2 text-left text-sm"
                  onClick={() => openViewer(file.id)}
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.file_name}</span>
                </button>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {file.file_type.toUpperCase()}
                  </Badge>
                  {file.is_downloadable ? (
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => download(file.id)}>
                      <Download className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="min-h-[70vh]">
        <CardContent className="h-full p-0">
          {viewerUrl ? (
            <iframe src={viewerUrl} title="Fayl ko'ruvchisi" className="h-[70vh] w-full rounded-lg" />
          ) : (
            <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">
              O'qish uchun chapdan faylni tanlang
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
