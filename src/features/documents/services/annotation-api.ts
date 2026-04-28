import { api } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { DocumentAnnotation } from '../types/annotation';

type CreateAnnotationPayload = {
  comment: string;
  quotedText: string;
  highlightColor?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;
};

export type MockAutoAnnotation = {
  text: string;
  pageNumber: number;
  color: "RED" | "BLUE" | "GREEN";
  documentRef: string;
};

export type FullDocReference = {
  foundRef: string;
  pagenum: number;
  docuementLink: string;
};

export async function fetchAnnotations(
  documentId: string,
): Promise<DocumentAnnotation[]> {
  const { data } = await api.get<DocumentAnnotation[]>(
    API_ENDPOINTS.DOCUMENTS.ANNOTATIONS(documentId),
  );
  return data;
}

export async function createAnnotation(
  documentId: string,
  payload: CreateAnnotationPayload,
): Promise<DocumentAnnotation> {
  const { data } = await api.post<DocumentAnnotation>(
    API_ENDPOINTS.DOCUMENTS.ANNOTATIONS(documentId),
    payload,
  );
  return data;
}

export async function downloadAnnotatedDocument(documentId: string): Promise<Blob> {
  const { data } = await api.get<Blob>(
    API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId),
    { responseType: 'blob' },
  );
  return data;
}

export async function fetchMockAutoAnnotations(
  documentId: string,
  payload: {
    selectedText: string;
    documentRef?: string;
    mockResponses?: MockAutoAnnotation[];
  },
): Promise<MockAutoAnnotation[]> {
  const { data } = await api.post<MockAutoAnnotation[]>(
    API_ENDPOINTS.DOCUMENTS.MOCK_AUTO_ANNOTATIONS(documentId),
    payload,
  );
  return data;
}

export async function fetchMockFullDocReferences(
  documentId: string,
  payload: {
    paragraphs: Array<{ text: string; pageNumber: number }>;
  },
): Promise<FullDocReference[]> {
  const { data } = await api.post<FullDocReference[]>(
    API_ENDPOINTS.DOCUMENTS.MOCK_FULL_DOC_REFERENCES(documentId),
    payload,
  );
  return data;
}
