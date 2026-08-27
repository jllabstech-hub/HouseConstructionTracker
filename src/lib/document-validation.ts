import path from "path";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/acad",
  "application/x-dwg",
  "image/vnd.dwg",
]);

export const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
  ".dwg",
]);

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20 MB

export function sanitizeFileName(rawName: string): string {
  // Strip path traversal sequences, directory delimiters, and non-safe characters
  const base = path.basename(rawName).replace(/[\0\x00-\x1f\\/:*?"<>|]/g, "_");
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.length > 0 ? sanitized : "document";
}

export function validateDocumentFile(file: { name: string; size: number; type: string }) {
  if (!file || file.size === 0) {
    return { valid: false, error: "Please choose a blueprint, drawing, or photo file" };
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return { valid: false, error: "File exceeds maximum allowed size of 20 MB" };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension (${ext || "none"}). Allowed formats: PDF, JPG, PNG, WEBP, SVG, DWG`,
    };
  }

  const mimeType = file.type?.toLowerCase() || "application/octet-stream";
  // Allow octet-stream for CAD DWG files if extension matches
  if (!ALLOWED_MIME_TYPES.has(mimeType) && !(mimeType === "application/octet-stream" && ext === ".dwg")) {
    return {
      valid: false,
      error: `Unsupported file type (${mimeType}). Allowed formats: PDF, JPG, PNG, WEBP, SVG, DWG`,
    };
  }

  return { valid: true, sanitizedName: sanitizeFileName(file.name), ext, mimeType };
}

export function extensionFor(mime: string, originalExt: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/svg+xml") return ".svg";
  if (mime === "application/pdf") return ".pdf";
  if (originalExt && ALLOWED_EXTENSIONS.has(originalExt.toLowerCase())) {
    return originalExt.toLowerCase();
  }
  return ".pdf";
}
