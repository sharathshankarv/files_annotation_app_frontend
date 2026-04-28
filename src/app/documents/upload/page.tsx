"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { FileUploadZone } from "@/features/documents/components/FileUploadZone";
import { UploadDocumentResponse } from "@/features/documents/types/upload";
import { useNavigator } from "@/hooks/use-navigator";
import { UPLOAD_CONFIG } from "@/utils/constants";
import { runFullDocScan } from "@/features/documents/services/full-doc-scan";
import { toast } from "sonner";

export default function UploadPage() {
  const navigate = useNavigator();
  const searchParams = useSearchParams();
  const [pageError, setPageError] = useState<string | null>(null);
  const [isBackgroundScanning, setIsBackgroundScanning] = useState(false);
  const fullScanMode = searchParams.get("mode") === "full-scan";

  const handleUploadSuccess = (data: UploadDocumentResponse) => {
    if (!data?.documentId) {
      setPageError(UPLOAD_CONFIG.STANDARD_ERRORS.INVALID_RESPONSE);
      return;
    }

    const process = async () => {
      setPageError(null);

      if (!fullScanMode) {
        navigate.goToDocument(data.documentId);
        return;
      }

      setIsBackgroundScanning(true);
      try {
        const result = await runFullDocScan(data.documentId);
        if (result.matchedRefs > 0) {
          toast.success(`Scan completed. ${result.matchedRefs} reference(s) annotated.`);
        } else {
          toast.info("Scan completed. No references matched.");
        }
      } catch (error) {
        console.error("[FullScanUpload] Scan failed after upload:", error);
        toast.error("File uploaded, but full scan failed. Opening document anyway.");
      } finally {
        setIsBackgroundScanning(false);
        navigate.goToDocument(data.documentId);
      }
    };

    void process();
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Upload Document</h1>
        <p className="text-slate-500 mt-2">
          {fullScanMode
            ? "Upload a PDF and we will scan it in background for references."
            : "Add a PDF, DOCX, PPTX, or PPT to start your annotation session."}
        </p>
      </div>

      {isBackgroundScanning && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Scanning the document and finding references...
        </div>
      )}

      {pageError && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      <FileUploadZone
        onSuccess={handleUploadSuccess}
        mode={fullScanMode ? "full-scan" : "annotate"}
      />
    </div>
  );
}
