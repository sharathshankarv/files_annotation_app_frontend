"use client";

import { useParams } from "next/navigation";
import WorkspaceRouteResolver from "@/features/documents/components/WorkspaceRouteResolver";

export default function Page() {
  const { documentId } = useParams();

  return <WorkspaceRouteResolver documentId={documentId as string} />;
}
