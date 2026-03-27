"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { FileUploadZone } from "@/features/documents/components/FileUploadZone";
import { UploadDocumentResponse } from "@/features/documents/types/upload";
import { useNavigator } from "@/hooks/use-navigator";
import { UPLOAD_CONFIG } from "@/utils/constants";

export default function UploadPage() {
  const navigate = useNavigator();
  const [pageError, setPageError] = useState<string | null>(null);

  const handleUploadSuccess = (data: UploadDocumentResponse) => {
    try {
      if (!data?.documentId) {
        setPageError(UPLOAD_CONFIG.STANDARD_ERRORS.INVALID_RESPONSE);
        return;
      }

      setPageError(null);
      navigate.goToDocument(data.documentId);
    } catch {
      setPageError(UPLOAD_CONFIG.STANDARD_ERRORS.UNEXPECTED);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Upload Document</h1>
        <p className="text-slate-500 mt-2">
          Add a PDF to start your annotation session.
        </p>
      </div>

      {pageError && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      <FileUploadZone onSuccess={handleUploadSuccess} />
    </div>
  );
}
