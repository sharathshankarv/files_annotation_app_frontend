import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { createAnnotation, fetchMockFullDocReferences } from "./annotation-api";
import { extractPdfParagraphs } from "./pdf-paragraph-extractor";
import { locatePdfMatch, locatePdfMatchAcrossPages } from "./pdf-match-locator";
import { API_CONFIG } from "@/utils/constants";

type DocumentDetails = {
  documentId: string;
  name: string;
  url: string;
  mimeType?: string;
};

export type FullDocScanResult = {
  totalRefs: number;
  matchedRefs: number;
};

async function fetchDocumentDetails(documentId: string): Promise<DocumentDetails> {
  const { data } = await api.get(`${API_ENDPOINTS.DOCUMENTS.BASE}/${documentId}`);
  const fullUrl = data.url.startsWith("http")
    ? data.url
    : `${API_CONFIG.BASE_URL}${data.url}`;
  return { ...data, url: fullUrl };
}

export async function runFullDocScan(documentId: string): Promise<FullDocScanResult> {
  const doc = await fetchDocumentDetails(documentId);
  if (doc.mimeType !== "application/pdf") {
    return { totalRefs: 0, matchedRefs: 0 };
  }

  const paragraphs = await extractPdfParagraphs(doc.url);
  console.log("[FullDocScan] Extracted paragraphs:", paragraphs.map((p) => ({
    pageNumber: p.pageNumber,
    text: p.text,
  })));
  const refs = await fetchMockFullDocReferences(documentId, { paragraphs });
  console.log("[FullDocScan] References received:", refs);

  let matched = 0;
  for (const ref of refs) {
    console.log("[FullDocScan] Trying match:", {
      pagenum: ref.pagenum,
      foundRef: ref.foundRef,
      docuementLink: ref.docuementLink,
    });

    const selectionOnPage = await locatePdfMatch(doc.url, ref.pagenum, ref.foundRef);
    const selection =
      selectionOnPage ?? (await locatePdfMatchAcrossPages(doc.url, ref.foundRef));
    if (!selection) continue;

    await createAnnotation(documentId, {
      comment: `Reference: ${ref.docuementLink}`,
      quotedText: ref.foundRef,
      highlightColor: "#f59e0b",
      page: selection.pageNumber,
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
      normalizedX: selection.normalizedX,
      normalizedY: selection.normalizedY,
      normalizedWidth: selection.normalizedWidth,
      normalizedHeight: selection.normalizedHeight,
    });
    matched += 1;
    console.log("[FullDocScan] Matched and annotated:", {
      pageNumber: selection.pageNumber,
      text: ref.foundRef,
    });
  }

  return { totalRefs: refs.length, matchedRefs: matched };
}
