"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { toast } from "sonner";
import { PDFPageTile } from "./pdf-viewer/PDFPageTile";
import { PDFViewerToolbar } from "./pdf-viewer/PDFViewerToolbar";
import { MAX_SCALE, MIN_SCALE, PAGE_WIDTH } from "./pdf-viewer/constants";
import { SelectionPayload } from "./pdf-viewer/types";
import { usePdfFileConfig } from "./pdf-viewer/usePdfFileConfig";
import { useVirtualPdfPages } from "./pdf-viewer/useVirtualPdfPages";
import { submitSelectionDummy } from "../services/submit-selection";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PDFViewer({
  fileUrl,
  onPageChange,
  onReady,
  currentPage,
  onSelectionChange,
}: {
  fileUrl: string;
  onPageChange: (page: number) => void;
  onReady?: (helpers: { scrollToPage: (page: number) => void }) => void;
  currentPage: number;
  onSelectionChange?: (selection: SelectionPayload | null) => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectionPayload, setSelectionPayload] =
    useState<SelectionPayload | null>(null);
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);
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

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionPayload(null);
      onSelectionChange?.(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setSelectionPayload(null);
      onSelectionChange?.(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const startNode =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element);
    const pageElement = startNode?.closest("[data-page]") as HTMLElement | null;

    if (!pageElement) {
      setSelectionPayload(null);
      onSelectionChange?.(null);
      return;
    }

    const pageNumber = Number.parseInt(pageElement.dataset.page || "", 10);
    if (!pageNumber || Number.isNaN(pageNumber)) {
      setSelectionPayload(null);
      onSelectionChange?.(null);
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    const x = rect.left - pageRect.left;
    const y = rect.top - pageRect.top;
    const normalizedX = Math.min(Math.max(x / pageRect.width, 0), 1);
    const normalizedY = Math.min(Math.max(y / pageRect.height, 0), 1);

    const payload: SelectionPayload = {
      pageNumber,
      text: selectedText,
      x,
      y,
      normalizedX,
      normalizedY,
    };

    setSelectionPayload(payload);
    onSelectionChange?.(payload);
  }, [onSelectionChange]);

  const handleSubmitSelection = useCallback(async () => {
    if (!selectionPayload || isSubmittingSelection) return;

    setIsSubmittingSelection(true);
    try {
      const response = await submitSelectionDummy(selectionPayload);
      console.log("Selection payload submitted:", response.payload);
      toast.success("Selection payload submitted");
    } catch {
      toast.error("Failed to submit selection payload");
    } finally {
      setIsSubmittingSelection(false);
    }
  }, [isSubmittingSelection, selectionPayload]);

  return (
    <div className="flex h-full flex-col">
      <PDFViewerToolbar
        currentPage={currentPage}
        onZoomIn={() => setScale((value) => Math.min(MAX_SCALE, value + 0.2))}
        onZoomOut={() => setScale((value) => Math.max(MIN_SCALE, value - 0.2))}
        onRotate={() => setRotation((value) => (value + 90) % 360)}
        onSubmitSelection={handleSubmitSelection}
        canSubmitSelection={!!selectionPayload}
        isSubmittingSelection={isSubmittingSelection}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        onMouseUp={captureSelection}
      >
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
