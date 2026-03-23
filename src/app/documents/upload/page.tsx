"use client";

import { FileUploadZone } from "@/features/documents/components/FileUploadZone";
import { useNavigator } from "@/hooks/use-navigator"; // 🛡️ Use our centralized nav

export default function UploadPage() {
  const navigate = useNavigator();

  const handleUploadSuccess = (data: any) => {
    navigate.goToDocument(data.documentId);
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Upload Document</h1>
        <p className="text-slate-500 mt-2">
          Add a PDF to start your annotation session.
        </p>
      </div>

      <FileUploadZone onSuccess={handleUploadSuccess} />
    </div>
  );
}
