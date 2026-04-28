"use client";

import React, { useState, useRef } from "react";
import { Upload, Check } from "lucide-react";
import { useFileUpload } from "../hooks/use-file-upload";
import { UploadDocumentResponse } from "../types/upload";

export function FileUploadZone({
  onSuccess,
  mode = "annotate",
}: {
  onSuccess: (data: UploadDocumentResponse) => void;
  mode?: "annotate" | "full-scan";
}) {
  const {
    uploading,
    progress,
    isSuccess,
    upload,
    setIsSuccess,
    setProgress,
    clearError,
  } = useFileUpload(onSuccess);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetSelectedFile = () => {
    setFile(null);
    setIsSuccess(false);
    setProgress(0);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setIsSuccess(false);
      setProgress(0);
      clearError();
    }
  };

  const handleConfirm = async () => {
    if (uploading) return;

    const result = await upload(file);
    if (
      !result.ok &&
      (result.reason === "invalid_type" || result.reason === "too_large")
    ) {
      resetSelectedFile();
    }

  };

  return (
    <div className="border-2 border-dashed rounded-xl p-8 text-center transition-all">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        accept=".pdf,.docx,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
      />

      {!file && !isSuccess && (
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Upload size={24} />
          </div>
          <p className="font-semibold">Click to upload document</p>
          <p className="text-xs text-slate-500 mt-2">
            PDF, DOCX, PPTX, and PPT files are supported.
          </p>
        </label>
      )}

      {file && !isSuccess && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Selected: {file.name}
          </p>
          {uploading ? (
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
              <p className="text-xs mt-2 text-slate-500">
                Uploading... {progress}%
              </p>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 w-full"
            >
              {mode === "full-scan" ? "Upload and Scan" : "Confirm and Start Annotate"}
            </button>
          )}
        </div>
      )}

      {isSuccess && (
        <div className="text-green-600 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <Check size={24} />
          </div>
          <p className="font-bold">Upload Complete!</p>
          <p className="text-xs text-slate-500">Redirecting to workspace...</p>
        </div>
      )}
    </div>
  );
}
