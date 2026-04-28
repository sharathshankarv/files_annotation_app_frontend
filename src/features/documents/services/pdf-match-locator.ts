import { api } from "@/lib/api-client";
import { SelectionPayload } from "../components/pdf-viewer/types";

type TextItem = {
  str: string;
  width: number;
  height: number;
  transform: number[];
};

type PageCache = {
  width: number;
  height: number;
  text: string;
  itemRanges: Array<{ start: number; end: number; item: TextItem }>;
};

const docCache = new Map<string, Promise<Map<number, PageCache>>>();

async function getPdfJs() {
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return mod;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (value: string) => normalize(value).split(" ").filter(Boolean);

function overlapRatio(target: string, candidate: string): number {
  const a = words(target);
  const b = new Set(words(candidate));
  if (!a.length) return 0;
  let hit = 0;
  for (const w of a) {
    if (b.has(w)) hit += 1;
  }
  return hit / a.length;
}

async function loadPdfCache(fileUrl: string): Promise<Map<number, PageCache>> {
  if (docCache.has(fileUrl)) {
    return docCache.get(fileUrl)!;
  }

  const run = (async () => {
    if (typeof window === "undefined") {
      throw new Error("PDF matching is available only in browser runtime.");
    }

    const pdfjs = await getPdfJs();
    const response = await api.get<Blob>(fileUrl, { responseType: "blob" });
    const bytes = new Uint8Array(await response.data.arrayBuffer());
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    const pageMap = new Map<number, PageCache>();

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const items = textContent.items.filter(
        (item): item is TextItem =>
          "str" in item &&
          "transform" in item &&
          Array.isArray(item.transform),
      );

      let text = "";
      const itemRanges: Array<{ start: number; end: number; item: TextItem }> = [];
      for (const item of items) {
        const token = item.str || "";
        if (!token.trim()) continue;
        const start = text.length;
        text += `${token} `;
        const end = text.length;
        itemRanges.push({ start, end, item });
      }

      pageMap.set(pageNumber, {
        width: viewport.width,
        height: viewport.height,
        text: text.trim(),
        itemRanges,
      });
    }

    return pageMap;
  })();

  docCache.set(fileUrl, run);
  return run;
}

function findBestSpan(text: string, target: string): { start: number; end: number; score: number } | null {
  const exactStart = text.toLowerCase().indexOf(target.toLowerCase());
  if (exactStart >= 0) {
    return { start: exactStart, end: exactStart + target.length, score: 1 };
  }

  const tokens = text.split(" ").filter(Boolean);
  const targetWords = words(target);
  if (!tokens.length || !targetWords.length) return null;

  const minWindow = Math.max(4, Math.floor(targetWords.length * 0.6));
  const maxWindow = Math.max(minWindow, Math.ceil(targetWords.length * 1.4));

  let best = { start: -1, end: -1, score: 0 };
  for (let i = 0; i < tokens.length; i += 1) {
    for (let size = minWindow; size <= maxWindow && i + size <= tokens.length; size += 1) {
      const snippet = tokens.slice(i, i + size).join(" ");
      const score = overlapRatio(target, snippet);
      if (score > best.score) {
        const start = text.toLowerCase().indexOf(snippet.toLowerCase());
        if (start >= 0) {
          best = { start, end: start + snippet.length, score };
        }
      }
    }
  }

  if (best.score < 0.8 || best.start < 0) return null;
  return best;
}

export async function locatePdfMatch(
  fileUrl: string,
  pageNumber: number,
  targetText: string,
): Promise<SelectionPayload | null> {
  const cache = await loadPdfCache(fileUrl);
  const page = cache.get(pageNumber);
  if (!page) return null;

  const span = findBestSpan(page.text, targetText);
  if (!span) return null;

  const matchedItems = page.itemRanges.filter(
    (range) => range.end >= span.start && range.start <= span.end,
  );
  if (!matchedItems.length) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const match of matchedItems) {
    const item = match.item;
    const x = item.transform[4];
    const y = item.transform[5];
    const w = Math.max(item.width || 0, 1);
    const h = Math.max(item.height || Math.abs(item.transform[3]) || 8, 1);
    const top = page.height - (y + h);
    const left = x;
    const right = x + w;
    const bottom = top + h;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  }

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return {
    pageNumber,
    text: targetText,
    x: minX,
    y: minY,
    width,
    height,
    normalizedX: Math.min(Math.max(minX / page.width, 0), 1),
    normalizedY: Math.min(Math.max(minY / page.height, 0), 1),
    normalizedWidth: Math.min(Math.max(width / page.width, 0), 1),
    normalizedHeight: Math.min(Math.max(height / page.height, 0), 1),
  };
}

export async function locatePdfMatchAcrossPages(
  fileUrl: string,
  targetText: string,
): Promise<SelectionPayload | null> {
  const cache = await loadPdfCache(fileUrl);
  const pageNumbers = Array.from(cache.keys()).sort((a, b) => a - b);

  for (const pageNumber of pageNumbers) {
    const found = await locatePdfMatch(fileUrl, pageNumber, targetText);
    if (found) return found;
  }

  return null;
}
