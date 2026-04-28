"use client";

import { useParams } from "next/navigation";
import DocumentWorkspace from "@/features/documents/components/DocumentWorkspace";

export default function DocxWorkspacePage() {
  const { documentId } = useParams();

  return <DocumentWorkspace documentId={documentId as string} />;
}
