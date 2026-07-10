import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  deleteBookFile,
  getDownloadUrl,
  updateFileDownloadable,
  uploadBookFile,
} from "@/modules/electronic-library/api/electronic-library-api";
import type { BookFileSummary } from "@/modules/catalog/types/book-summary";

const FILE_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "ppt", label: "PPT" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "zip", label: "ZIP" },
];

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

function formatSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ElectronicFilesPanel({ bookId, files }: { bookId: string; files: BookFileSummary[] }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileType, setFileType] = useState("pdf");
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
  }

  function uploadFiles(fileList: FileList | File[]) {
    Array.from(fileList).forEach((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploading((prev) => [...prev, { id, name: file.name, progress: 0 }]);

      uploadBookFile(bookId, file, fileType, true, (percent) => {
        setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, progress: percent } : u)));
      })
        .then(() => {
          setUploading((prev) => prev.filter((u) => u.id !== id));
          invalidate();
          toast.success(`${file.name} yuklandi`);
        })
        .catch((error: Error) => {
          setUploading((prev) => prev.map((u) => (u.id === id ? { ...u, error: error.message } : u)));
        });
    });
  }

  async function handleToggleDownloadable(file: BookFileSummary) {
    await updateFileDownloadable(file.id, !file.is_downloadable);
    invalidate();
  }

  async function handleDownload(file: BookFileSummary) {
    try {
      const { url } = await getDownloadUrl(file.id);
      window.open(url, "_blank");
    } catch {
      toast.error("Yuklab olib bo'lmadi");
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteBookFile(deletingId);
    invalidate();
    setDeletingId(null);
    toast.success("Fayl o'chirildi");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Elektron fayllar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">fayl turini tanlang, so'ng yuklang</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm">Fayllarni shu yerga tashlang yoki bosing</p>
          <p className="text-xs text-muted-foreground">Bir nechta faylni birdek yuklash mumkin</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>

        {uploading.length > 0 ? (
          <div className="space-y-2">
            {uploading.map((u) => (
              <div key={u.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{u.name}</span>
                  <span className={u.error ? "text-destructive" : "text-muted-foreground"}>
                    {u.error ?? `${u.progress}%`}
                  </span>
                </div>
                <Progress value={u.progress} />
              </div>
            ))}
          </div>
        ) : null}

        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="mr-1">
                        {file.file_type.toUpperCase()}
                      </Badge>
                      {formatSize(file.file_size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={file.is_downloadable} onCheckedChange={() => handleToggleDownloadable(file)} />
                    <span className="text-xs text-muted-foreground">Yuklab olish</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(file)}>
                    <Download className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingId(file.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Hali fayl yuklanmagan</p>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Faylni o'chirish"
        description="Bu fayl butunlay o'chiriladi."
        destructive
        onConfirm={handleDelete}
      />
    </Card>
  );
}
