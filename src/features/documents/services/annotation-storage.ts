import { DocumentAnnotation } from "../types/annotation";

const KEY_PREFIX = "doc-annotations";

const getStorageKey = (documentId: string) => `${KEY_PREFIX}:${documentId}`;

export function loadAnnotations(documentId: string): DocumentAnnotation[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getStorageKey(documentId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DocumentAnnotation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnnotations(
  documentId: string,
  annotations: DocumentAnnotation[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(documentId),
    JSON.stringify(annotations),
  );
}
