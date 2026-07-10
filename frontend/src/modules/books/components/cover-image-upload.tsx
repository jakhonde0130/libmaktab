import { ImageIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { uploadBookCover } from "@/modules/books/api/upload-cover";

export function CoverImageUpload({ bookId, coverImageUrl }: { bookId: string; coverImageUrl: string | null }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Faqat JPEG, PNG yoki WebP rasm qabul qilinadi");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setProgress(0);

    uploadBookCover(bookId, file, setProgress)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
        toast.success("Muqova yuklandi");
      })
      .catch((error: Error) => {
        toast.error("Yuklab bo'lmadi", { description: error.message });
      })
      .finally(() => setProgress(null));
  }

  const displayUrl = previewUrl ?? coverImageUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Muqova rasmi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {displayUrl ? (
              <img src={displayUrl} alt="Muqova" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <Upload className="size-5 text-muted-foreground" />
              <p className="text-sm">Rasmni shu yerga tashlang yoki bosing</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG yoki WebP, 5MB gacha</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            {progress !== null ? <Progress value={progress} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
