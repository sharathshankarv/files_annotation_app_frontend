"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useDocument } from "@/features/documents/hooks/useDocument";
import CommentsPanel from "./CommentsPanel";
import { SelectionPayload } from "./pdf-viewer/types";

const PDFViewer = dynamic(() => import("./PDFViewer"), {
  ssr: false,
  loading: () => <p>Loading PDF...</p>,
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
  const [viewerApi, setViewerApi] = useState<{
    scrollToPage: (page: number) => void;
  } | null>(null);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;
  if (!doc) return <div className="p-6">No document found</div>;

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto bg-gray-100">
        <PDFViewer
          key={doc.url}
          fileUrl={doc.url}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onReady={setViewerApi}
          onSelectionChange={setPendingSelection}
        />
      </div>

      <div className="w-80 border-l">
        <CommentsPanel
          documentId={documentId}
          currentPage={currentPage}
          pendingSelection={pendingSelection}
          onConsumeSelection={() => setPendingSelection(null)}
          onCommentClick={(page) => viewerApi?.scrollToPage(page)}
        />
      </div>
    </div>
  );
}
