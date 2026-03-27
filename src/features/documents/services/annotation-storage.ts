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
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      ...item,
      width: item.width ?? 0,
      height: item.height ?? 0,
      normalizedWidth: item.normalizedWidth ?? 0.1,
      normalizedHeight: item.normalizedHeight ?? 0.02,
    }));
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
