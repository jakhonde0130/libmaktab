import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";
import type { BookDetail } from "@/modules/catalog/types/book-summary";

/** XHR-based upload (fetch has no upload progress event) with a progress callback. */
export function uploadBookCover(
  bookId: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<BookDetail> {
  return supabase.auth.getSession().then(
    ({ data }) =>
      new Promise((resolve, reject) => {
        const form = new FormData();
        form.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${env.VITE_API_URL}/books/${bookId}/cover`);
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
