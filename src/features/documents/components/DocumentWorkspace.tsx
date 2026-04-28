"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useDocument } from "@/features/documents/hooks/useDocument";
import CommentsPanel from "./CommentsPanel";
import { DocumentAnnotation } from "../types/annotation";
import { SelectionPayload } from "./pdf-viewer/types";
import { downloadAnnotatedDocument } from "../services/annotation-api";

const PDF_MIME_TYPE = "application/pdf";
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const PPT_MIME_TYPE = "application/vnd.ms-powerpoint";

const PDFViewer = dynamic(() => import("./PDFViewer"), {
  ssr: false,
  loading: () => <p>Loading PDF...</p>,
});

const DocxViewer = dynamic(() => import("./DocxViewer"), {
  ssr: false,
  loading: () => <p>Loading DOCX...</p>,
});

const PPTViewer = dynamic(() => import("./PPTViewer"), {
  ssr: false,
  loading: () => <p>Loading PPTX...</p>,
});

export default function DocumentWorkspace({
  documentId,
}: {
  documentId: string;
}) {
  const { doc, loading, error } = useDocument(documentId);

  const [currentPage, setCurrentPage] = useState(1);
  const [pendingSelection, setPendingSelection] =
    useState<SelectionPayload | null>(null);
  const [persistedSelection, setPersistedSelection] =
    useState<SelectionPayload | null>(null);
  const [hoveredAnnotation, setHoveredAnnotation] =
    useState<DocumentAnnotation | null>(null);
  const [viewerApi, setViewerApi] = useState<{
    scrollToPage: (page: number) => void;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!doc) return;

    setIsDownloading(true);
    try {
      const blob = await downloadAnnotatedDocument(documentId);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = doc.name || "annotated-document";
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;
  if (!doc) return <div className="p-6">No document found</div>;

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-hidden bg-gray-100 flex flex-col">
        <div className="flex items-center justify-between border-b bg-white px-4 py-2">
          <p className="text-sm font-medium text-slate-700 truncate pr-4">
            {doc.name}
          </p>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isDownloading ? "Preparing..." : "Download Annotated"}
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {doc.mimeType === PDF_MIME_TYPE ? (
            <PDFViewer
              documentId={documentId}
              key={doc.url}
              fileUrl={doc.url}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onReady={setViewerApi}
              onSelectionChange={setPendingSelection}
              hoveredAnnotation={hoveredAnnotation}
            />
          ) : doc.mimeType === DOCX_MIME_TYPE ? (
            <DocxViewer
              key={doc.url}
              fileUrl={doc.url}
              onPageChange={setCurrentPage}
              onReady={setViewerApi}
              onSelectionChange={(selection) => {
                setPendingSelection(selection);
                if (selection) {
                  setPersistedSelection(selection);
                }
              }}
              hoveredAnnotation={hoveredAnnotation}
              pendingSelection={pendingSelection}
              persistedSelection={persistedSelection}
            />
          ) : doc.mimeType === PPTX_MIME_TYPE || doc.mimeType === PPT_MIME_TYPE ? (
            <PPTViewer
              key={doc.url}
              documentId={documentId}
              onPageChange={setCurrentPage}
              onReady={setViewerApi}
              onSelectionChange={(selection) => {
                setPendingSelection(selection);
                if (selection) {
                  setPersistedSelection(selection);
                }
              }}
              hoveredAnnotation={hoveredAnnotation}
              pendingSelection={pendingSelection}
              persistedSelection={persistedSelection}
            />
          ) : (
            <div className="p-6 text-sm text-slate-600">
              Preview is currently available for PDF, DOCX, and PPTX files. You
              can still download the annotated document.
            </div>
          )}
        </div>
      </div>

      <div className="w-80 border-l">
        <CommentsPanel
          documentId={documentId}
          fileUrl={doc.url}
          currentPage={currentPage}
          pendingSelection={pendingSelection}
          onConsumeSelection={() => setPendingSelection(null)}
          onHoverAnnotationChange={setHoveredAnnotation}
          onCommentClick={(page) => viewerApi?.scrollToPage(page)}
        />
      </div>
    </div>
  );
}
