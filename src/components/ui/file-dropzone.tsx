"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  name: string;
  required?: boolean;
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
  helperText?: string;
  onFileSelect?: (file: File | null) => void;
  className?: string;
}

export function FileDropzone({
  name,
  required = false,
  accept = "image/jpeg,image/png,image/webp,image/svg+xml,application/pdf",
  maxSizeBytes = 20 * 1024 * 1024, // 20 MB default
  label,
  helperText,
  onFileSelect,
  className,
}: FileDropzoneProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (onFileSelect) onFileSelect(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      setError(
        language === "te"
          ? `ఫైల్ పరిమాణం చాలా పెద్దది (${(file.size / (1024 * 1024)).toFixed(1)}MB). గరిష్ట పరిమితి ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`
          : `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`
      );
      return;
    }

    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Sync with hidden input
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
      }
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    handleFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-xs font-bold text-ink-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden File Input for Native Form Submission */}
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        required={required && !selectedFile}
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        id={`file-input-${name}`}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-clay-600 bg-clay-100/70 scale-[1.01] shadow-md ring-4 ring-clay-500/20"
            : selectedFile
            ? "border-emerald-400 bg-emerald-50/40"
            : "border-paper-300 bg-paper-50/70 hover:border-clay-400 hover:bg-paper-100/80"
        )}
      >
        {selectedFile ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full text-left p-1">
            {/* Thumbnail preview or PDF icon */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-paper-200 bg-white shadow-xs flex items-center justify-center">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={selectedFile.name}
                  fill
                  className="object-cover"
                />
              ) : selectedFile.type === "application/pdf" ? (
                <div className="flex flex-col items-center justify-center text-red-500">
                  <FileText className="h-9 w-9" />
                  <span className="text-[10px] font-extrabold uppercase mt-0.5">PDF</span>
                </div>
              ) : (
                <ImageIcon className="h-8 w-8 text-clay-600" />
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-0.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>{language === "te" ? "ఫైల్ ఎంపికైంది" : "File Ready to Upload"}</span>
              </div>
              <p className="text-sm font-extrabold text-ink-900 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-ink-500 font-medium mt-0.5">
                {formatFileSize(selectedFile.size)} · {selectedFile.type || "Document"}
              </p>
            </div>

            {/* Remove / Change button */}
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 rounded-xl bg-paper-200/80 hover:bg-red-100 hover:text-red-700 px-3 py-2 text-xs font-bold text-ink-700 transition active:scale-95"
              title={language === "te" ? "ఫైల్ మార్చండి / తొలగించండి" : "Remove file"}
            >
              <X className="h-4 w-4" />
              <span>{language === "te" ? "మార్చండి" : "Change"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-white shadow-xs text-clay-600 border border-paper-200">
              <UploadCloud className={cn("h-7 w-7 transition-transform", isDragging && "scale-110 text-clay-700")} />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-extrabold text-ink-900">
                {isDragging ? (
                  <span className="text-clay-700">
                    {language === "te" ? "ఇక్కడే ఫైల్‌ను వదలండి (Drop here)..." : "Drop your file here..."}
                  </span>
                ) : (
                  <>
                    <span className="text-clay-700 underline font-bold">
                      {language === "te" ? "ఫైల్స్ బ్రౌజ్ చేయండి" : "Browse from Computer / Mobile"}
                    </span>{" "}
                    <span className="text-ink-600 font-medium">
                      {language === "te" ? "లేదా డ్రాగ్ & డ్రాప్ చేయండి" : "or drag & drop here"}
                    </span>
                  </>
                )}
              </p>

              <p className="text-xs text-ink-400 font-medium">
                {helperText ??
                  (language === "te"
                    ? "ఫోటోలు (JPG, PNG, WebP) లేదా PDF ప్లాన్లు (గరిష్టంగా 20 MB)"
                    : "Supports Images (JPG, PNG, WebP) or PDF Blueprints (Up to 20 MB)")}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-bold text-red-600 mt-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
