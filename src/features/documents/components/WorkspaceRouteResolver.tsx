"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDocument } from "../hooks/useDocument";
import DocumentWorkspace from "./DocumentWorkspace";

const MIME_ROUTE_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "ppt",
  "application/vnd.ms-powerpoint": "ppt",
};

export default function WorkspaceRouteResolver({
  documentId,
}: {
  documentId: string;
}) {
  const router = useRouter();
  const { doc, loading, error } = useDocument(documentId);

  useEffect(() => {
    if (!doc?.mimeType) return;

    const routeSegment = MIME_ROUTE_MAP[doc.mimeType];
    if (routeSegment) {
      router.replace(`/workspace/${routeSegment}/${documentId}`);
    }
  }, [doc?.mimeType, documentId, router]);

  if (loading) {
    return <div className="p-6">Resolving workspace...</div>;
  }

  if (error) {
    return <div className="p-6">Error: {error}</div>;
  }

  if (!doc) {
    return <div className="p-6">No document found</div>;
  }

  if (!doc.mimeType || !MIME_ROUTE_MAP[doc.mimeType]) {
    return <DocumentWorkspace documentId={documentId} />;
  }

  return <div className="p-6">Loading workspace...</div>;
}
