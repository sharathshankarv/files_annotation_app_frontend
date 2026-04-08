import { api } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { DocumentAnnotation } from '../types/annotation';

type CreateAnnotationPayload = {
  comment: string;
  quotedText: string;
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
