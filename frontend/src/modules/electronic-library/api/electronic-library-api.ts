import { env } from "@/config/env";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

export interface UploadedBookFile {
  id: string;
  book_id: string;
  file_type: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  is_downloadable: boolean;
  created_at: string;
}

/** XHR-based upload (fetch has no upload progress event) with a progress callback. */
export function uploadBookFile(
  bookId: string,
  file: File,
  fileType: string,
  isDownloadable: boolean,
  onProgress: (percent: number) => void
): Promise<UploadedBookFile> {
  return supabase.auth.getSession().then(
    ({ data }) =>
      new Promise((resolve, reject) => {
        const form = new FormData();
        form.append("file", file);
        form.append("fileType", fileType);
        form.append("isDownloadable", String(isDownloadable));

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${env.VITE_API_URL}/electronic-library/books/${bookId}/files`);
        const token = data.session?.access_token;
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText).data);
          } else {
            const message = (() => {
              try {
                return JSON.parse(xhr.responseText)?.error?.message;
              } catch {
                return xhr.statusText;
              }
            })();
            reject(new Error(message || "Yuklashda xatolik"));
          }
        };
        xhr.onerror = () => reject(new Error("Tarmoq xatoligi"));
        xhr.send(form);
      })
  );
}

export function getViewUrl(fileId: string) {
  return apiClient
    .get<{ data: { url: string; fileName: string } }>(`/electronic-library/files/${fileId}/view-url`)
    .then((res) => res.data);
}

export function getDownloadUrl(fileId: string) {
  return apiClient
    .get<{ data: { url: string; fileName: string } }>(`/electronic-library/files/${fileId}/download-url`)
    .then((res) => res.data);
}

export function updateFileDownloadable(fileId: string, isDownloadable: boolean) {
  return apiClient
    .patch<{ data: UploadedBookFile }>(`/electronic-library/files/${fileId}`, { isDownloadable })
    .then((res) => res.data);
}

export function deleteBookFile(fileId: string) {
  return apiClient.delete<void>(`/electronic-library/files/${fileId}`);
}
