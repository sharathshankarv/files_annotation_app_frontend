"use client";

import { useEffect, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { PDFPageTile } from "./pdf-viewer/PDFPageTile";
import { PDFViewerToolbar } from "./pdf-viewer/PDFViewerToolbar";
import { MAX_SCALE, MIN_SCALE, PAGE_WIDTH } from "./pdf-viewer/constants";
import { usePdfFileConfig } from "./pdf-viewer/usePdfFileConfig";
import { useVirtualPdfPages } from "./pdf-viewer/useVirtualPdfPages";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PDFViewer({
  fileUrl,
  onPageChange,
  onReady,
  currentPage,
}: {
  fileUrl: string;
  onPageChange: (page: number) => void;
  onReady?: (helpers: { scrollToPage: (page: number) => void }) => void;
  currentPage: number;
}) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fileConfig = usePdfFileConfig(fileUrl);
  const {
    visiblePages,
    pageOffsets,
    totalHeight,
    pageErrors,
    scrollToPage,
    updatePageRatio,
    markPageError,
    clearPageError,
    initializePages,
  } = useVirtualPdfPages({
    numPages,
    scale,
    rotation,
    currentPage,
    containerRef,
    onPageChange,
  });

  useEffect(() => {
    if (!onReady || !numPages) return;

    onReady({
      scrollToPage,
    });
  }, [numPages, onReady, scrollToPage]);

  return (
    <div className="flex h-full flex-col">
      <PDFViewerToolbar
        currentPage={currentPage}
        onZoomIn={() => setScale((value) => Math.min(MAX_SCALE, value + 0.2))}
        onZoomOut={() => setScale((value) => Math.max(MIN_SCALE, value - 0.2))}
        onRotate={() => setRotation((value) => (value + 90) % 360)}
      />

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        <Document
          file={fileConfig}
          loading={<p className="text-sm text-gray-500">Loading PDF...</p>}
          onLoadError={(error) => setLoadError(error.message)}
          onLoadSuccess={({ numPages: loadedPages }) => {
            setLoadError(null);
            setNumPages(loadedPages);
            initializePages(loadedPages);
          }}
        >
          {loadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          ) : (
            <div
              className="relative mx-auto"
              style={{ height: totalHeight, width: PAGE_WIDTH }}
            >
              {visiblePages.map((pageNumber) => (
                <PDFPageTile
                  key={pageNumber}
                  pageNumber={pageNumber}
                  currentPage={currentPage}
                  pageTop={pageOffsets[pageNumber - 1] ?? 0}
                  scale={scale}
                  rotation={rotation}
                  errorMessage={pageErrors[pageNumber]}
                  onRenderError={markPageError}
                  onRenderSuccess={(targetPage, ratio) => {
                    clearPageError(targetPage);
                    updatePageRatio(targetPage, ratio);
                  }}
                />
              ))}
            </div>
          )}
        </Document>
      </div>
    </div>
  );
}
