export interface UploadResult {
  blob: Blob;
  filename: string;
  headers: Record<string, string>;
}

function parseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of raw.trim().split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) headers[key] = value;
  }
  return headers;
}

function extractFilename(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

/** POSTs FormData via XHR (not fetch) so we can report real upload progress. */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "blob";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Upload phase covers 0-70%; the remainder represents server-side processing.
        const percent = Math.round((event.loaded / event.total) * 70);
        onProgress(percent);
      }
    };

    xhr.onprogress = () => onProgress(90);

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        const disposition = xhr.getResponseHeader("Content-Disposition");
        resolve({
          blob: xhr.response as Blob,
          filename: extractFilename(disposition, "download"),
          headers: parseHeaders(xhr.getAllResponseHeaders()),
        });
        return;
      }

      try {
        const text = await (xhr.response as Blob).text();
        const parsed = JSON.parse(text);
        reject(new Error(parsed.error ?? `Request failed with status ${xhr.status}.`));
      } catch {
        reject(new Error(`Request failed with status ${xhr.status}.`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error. Please try again."));

    xhr.send(formData);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
