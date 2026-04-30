"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { PDFPageTile } from "./pdf-viewer/PDFPageTile";
import { PDFViewerToolbar } from "./pdf-viewer/PDFViewerToolbar";
import { MAX_SCALE, MIN_SCALE, PAGE_WIDTH } from "./pdf-viewer/constants";
import { SelectionPayload } from "./pdf-viewer/types";
import { usePdfFileConfig } from "./pdf-viewer/usePdfFileConfig";
import { useVirtualPdfPages } from "./pdf-viewer/useVirtualPdfPages";
import { DocumentAnnotation } from "../types/annotation";

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
  hoveredAnnotation,
  annotations,
}: {
  fileUrl: string;
  onPageChange: (page: number) => void;
  onReady?: (helpers: { scrollToPage: (page: number) => void }) => void;
  currentPage: number;
  onSelectionChange?: (selection: SelectionPayload | null) => void;
  hoveredAnnotation: DocumentAnnotation | null;
  annotations: DocumentAnnotation[];
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

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onSelectionChange?.(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      onSelectionChange?.(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects()).filter(
      (item) => item.width > 0 && item.height > 0,
    );
    const rect =
      rects.length > 0
        ? rects.reduce(
            (acc, current) => {
              const left = Math.min(acc.left, current.left);
              const top = Math.min(acc.top, current.top);
              const right = Math.max(acc.right, current.right);
              const bottom = Math.max(acc.bottom, current.bottom);

              return {
                left,
                top,
                right,
                bottom,
                width: right - left,
                height: bottom - top,
              };
            },
            {
              left: rects[0].left,
              top: rects[0].top,
              right: rects[0].right,
              bottom: rects[0].bottom,
              width: rects[0].width,
              height: rects[0].height,
            },
          )
        : range.getBoundingClientRect();
    const startNode =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element);
    const pageElement = startNode?.closest("[data-page]") as HTMLElement | null;

    if (!pageElement) {
      onSelectionChange?.(null);
      return;
    }

    const pageNumber = Number.parseInt(pageElement.dataset.page || "", 10);
    if (!pageNumber || Number.isNaN(pageNumber)) {
      onSelectionChange?.(null);
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    const x = rect.left - pageRect.left;
    const y = rect.top - pageRect.top;
    const width = rect.width;
    const height = rect.height;
    const normalizedX = Math.min(Math.max(x / pageRect.width, 0), 1);
    const normalizedY = Math.min(Math.max(y / pageRect.height, 0), 1);
    const normalizedWidth = Math.min(Math.max(width / pageRect.width, 0), 1);
    const normalizedHeight = Math.min(Math.max(height / pageRect.height, 0), 1);

    const payload: SelectionPayload = {
      pageNumber,
      text: selectedText,
      x,
      y,
      width,
      height,
      normalizedX,
      normalizedY,
      normalizedWidth,
      normalizedHeight,
    };

    onSelectionChange?.(payload);
  }, [onSelectionChange]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const startContainerElement =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as Element);

      const viewerContainer = containerRef.current;
      if (
        !viewerContainer ||
        !startContainerElement ||
        !viewerContainer.contains(startContainerElement)
      ) {
        return;
      }

      captureSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [captureSelection]);

  return (
    <div className="flex h-full flex-col">
      <PDFViewerToolbar
        currentPage={currentPage}
        onZoomIn={() => setScale((value) => Math.min(MAX_SCALE, value + 0.2))}
        onZoomOut={() => setScale((value) => Math.max(MIN_SCALE, value - 0.2))}
        onRotate={() => setRotation((value) => (value + 90) % 360)}
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
                  pageAnnotations={annotations.filter(
                    (item) => item.page === pageNumber,
                  )}
                  hoveredAnnotation={
                    hoveredAnnotation && hoveredAnnotation.page === pageNumber
                      ? hoveredAnnotation
                      : null
                  }
                />
              ))}
            </div>
          )}
        </Document>
      </div>
    </div>
  );
}
