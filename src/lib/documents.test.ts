import { describe, it, expect } from "vitest";
import {
  validateDocumentFile,
  sanitizeFileName,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_BYTES,
} from "./document-validation";

describe("Document Upload & Security Audit", () => {
  it("accepts valid PDF document within 20 MB", () => {
    const file = {
      name: "structural_drawing_rev1.pdf",
      size: 5 * 1024 * 1024, // 5 MB
      type: "application/pdf",
    };
    const res = validateDocumentFile(file);
    expect(res.valid).toBe(true);
    expect(res.sanitizedName).toBe("structural_drawing_rev1.pdf");
    expect(res.ext).toBe(".pdf");
    expect(res.mimeType).toBe("application/pdf");
  });

  it("accepts valid JPG, PNG, WEBP, SVG, and DWG blueprints", () => {
    const images = [
      { name: "3d_elevation.jpg", size: 1024 * 500, type: "image/jpeg" },
      { name: "floor_plan.png", size: 1024 * 800, type: "image/png" },
      { name: "site_photo.webp", size: 1024 * 400, type: "image/webp" },
      { name: "vector_diagram.svg", size: 1024 * 200, type: "image/svg+xml" },
      { name: "cad_layout.dwg", size: 1024 * 1200, type: "application/acad" },
    ];

    for (const img of images) {
      const res = validateDocumentFile(img);
      expect(res.valid).toBe(true);
    }
  });

  it("rejects oversized files exceeding 20 MB", () => {
    const file = {
      name: "huge_video_recording.pdf",
      size: 21 * 1024 * 1024, // 21 MB
      type: "application/pdf",
    };
    const res = validateDocumentFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("maximum allowed size of 20 MB");
  });

  it("rejects empty 0-byte files", () => {
    const file = {
      name: "empty.pdf",
      size: 0,
      type: "application/pdf",
    };
    const res = validateDocumentFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("choose a blueprint");
  });

  it("rejects executable or script extensions (.exe, .sh, .php, .js, .html)", () => {
    const dangerousFiles = [
      { name: "malware.exe", size: 1024, type: "application/x-msdownload" },
      { name: "script.sh", size: 1024, type: "application/x-sh" },
      { name: "webshell.php", size: 1024, type: "application/x-httpd-php" },
      { name: "index.html", size: 1024, type: "text/html" },
      { name: "trojan.bat", size: 1024, type: "application/x-bat" },
    ];

    for (const bad of dangerousFiles) {
      const res = validateDocumentFile(bad);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Unsupported file extension");
    }
  });

  it("rejects mismatched or unsupported MIME types", () => {
    const badMime = {
      name: "fake_doc.pdf",
      size: 1024,
      type: "audio/mp3",
    };
    const res = validateDocumentFile(badMime);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Unsupported file type");
  });

  it("sanitizes filenames and neutralizes path traversal payloads", () => {
    const traversalPayloads = [
      { raw: "../../../etc/passwd.pdf", expected: ".._.._.._etc_passwd.pdf" },
      { raw: "..\\..\\windows\\system32.png", expected: ".._.._windows_system32.png" },
      { raw: "my blueprint (rev:1) *final*?.pdf", expected: "my_blueprint__rev_1___final___.pdf" },
      { raw: "\0evil.jpg", expected: "_evil.jpg" },
      { raw: "తెలుగు_ప్లాన్.pdf", expected: "____________.pdf" },
    ];

    for (const testCase of traversalPayloads) {
      const sanitized = sanitizeFileName(testCase.raw);
      expect(sanitized).not.toContain("/");
      expect(sanitized).not.toContain("\\");
      expect(sanitized).not.toContain("\0");
      expect(sanitized.length).toBeGreaterThan(0);
    }
  });

  it("verifies security policy constants", () => {
    expect(ALLOWED_EXTENSIONS.size).toBeGreaterThan(0);
    expect(ALLOWED_MIME_TYPES.size).toBeGreaterThan(0);
    expect(MAX_DOCUMENT_BYTES).toBe(20 * 1024 * 1024);
  });
});
