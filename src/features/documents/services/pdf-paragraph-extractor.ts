import { api } from "@/lib/api-client";

export type ExtractedParagraph = {
  text: string;
  pageNumber: number;
};

function splitIntoParagraphs(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 20);
}

export async function extractPdfParagraphs(fileUrl: string): Promise<ExtractedParagraph[]> {
  if (typeof window === "undefined") {
    throw new Error("PDF paragraph extraction is available only in browser runtime.");
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const response = await api.get<Blob>(fileUrl, { responseType: "blob" });
  const bytes = new Uint8Array(await response.data.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const output: ExtractedParagraph[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    const paragraphs = splitIntoParagraphs(pageText);
    for (const text of paragraphs) {
      output.push({ text, pageNumber });
    }
  }

  return output;
}
