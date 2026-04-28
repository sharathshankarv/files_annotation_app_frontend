"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { SelectionPayload } from "./pdf-viewer/types";
import { DocumentAnnotation } from "../types/annotation";

type PptSlide = {
  pageNumber: number;
  title: string;
  textBlocks: string[];
};

type PptSlidesResponse = {
  documentId: string;
  name: string;
  slideCount: number;
  slides: PptSlide[];
};

export default function PPTViewer({
  documentId,
  onPageChange,
  onReady,
  onSelectionChange,
  hoveredAnnotation,
  pendingSelection,
  persistedSelection,
}: {
  documentId: string;
  onPageChange: (page: number) => void;
  onReady?: (helpers: { scrollToPage: (page: number) => void }) => void;
  onSelectionChange?: (selection: SelectionPayload | null) => void;
  hoveredAnnotation?: DocumentAnnotation | null;
  pendingSelection?: SelectionPayload | null;
  persistedSelection?: SelectionPayload | null;
}) {
  const [slides, setSlides] = useState<PptSlide[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const hostContainerRef = useRef<HTMLDivElement | null>(null);

  const getSlideElement = useCallback((pageNumber: number) => {
    if (!hostContainerRef.current) return null;
    return hostContainerRef.current.querySelector<HTMLElement>(
      `[data-page="${pageNumber}"]`,
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSlides = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const { data } = await api.get<PptSlidesResponse>(
          API_ENDPOINTS.DOCUMENTS.PPT_SLIDES(documentId),
        );
        if (isMounted) {
          setSlides(data.slides || []);
          onPageChange(1);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            typeof (error as { response?: { data?: { message?: unknown } } }).response
              ?.data?.message === "string"
              ? ((error as { response?: { data?: { message?: string } } }).response
                  ?.data?.message as string)
              : error instanceof Error
                ? error.message
                : "Unknown error";
          setLoadError(`Failed to render PPTX preview. ${message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSlides();

    return () => {
      isMounted = false;
    };
  }, [documentId, onPageChange]);

  useEffect(() => {
    if (!onReady) return;

    onReady({
      scrollToPage: (page) => {
        const targetPage = getSlideElement(Math.max(page, 1));
        if (targetPage) {
          targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
          onPageChange(page);
          return;
        }
        hostContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        onPageChange(1);
      },
    });
  }, [getSlideElement, onPageChange, onReady, slides.length]);

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
    const slideElement = startNode?.closest("[data-page]") as HTMLElement | null;

    if (!slideElement) {
      onSelectionChange?.(null);
      return;
    }

    const pageNumber = Number.parseInt(slideElement.dataset.page || "", 10);
    if (!pageNumber || Number.isNaN(pageNumber)) {
      onSelectionChange?.(null);
      return;
    }

    const pageRect = slideElement.getBoundingClientRect();
    const x = rect.left - pageRect.left;
    const y = rect.top - pageRect.top;
    const width = rect.width;
    const height = rect.height;
    const normalizedX = Math.min(Math.max(x / Math.max(pageRect.width, 1), 0), 1);
    const normalizedY = Math.min(Math.max(y / Math.max(pageRect.height, 1), 0), 1);
    const normalizedWidth = Math.min(
      Math.max(width / Math.max(pageRect.width, 1), 0),
      1,
    );
    const normalizedHeight = Math.min(
      Math.max(height / Math.max(pageRect.height, 1), 0),
      1,
    );

    onPageChange(pageNumber);
    onSelectionChange?.({
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
    });
  }, [onPageChange, onSelectionChange]);

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

      if (
        !hostContainerRef.current ||
        !startContainerElement ||
        !hostContainerRef.current.contains(startContainerElement)
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

  const activeHighlight =
    hoveredAnnotation ?? pendingSelection ?? persistedSelection ?? null;
  const activeHighlightPage =
    hoveredAnnotation?.page ??
    pendingSelection?.pageNumber ??
    persistedSelection?.pageNumber ??
    null;
  const activeHighlightColor =
    hoveredAnnotation?.highlightColor ??
    (persistedSelection ? "#fef08a" : pendingSelection ? "#fef08a" : "#fef08a");

  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);

  const handleScroll = useCallback(() => {
    if (!hostContainerRef.current || slides.length === 0) return;

    const containerRect = hostContainerRef.current.getBoundingClientRect();
    let nearestPage = 1;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide) => {
      const element = getSlideElement(slide.pageNumber);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerRect.top);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = slide.pageNumber;
      }
    });

    onPageChange(nearestPage);
  }, [getSlideElement, onPageChange, slides]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-2">
        <p className="text-xs text-slate-600">
          Slides: <span className="font-semibold">{slides.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))
            }
            className="rounded border px-2 py-1 text-sm"
          >
            -
          </button>
          <span className="min-w-14 text-center text-xs text-slate-600">
            {zoomPercent}%
          </span>
          <button
            onClick={() =>
              setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))
            }
            className="rounded border px-2 py-1 text-sm"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={hostContainerRef}
        className="flex-1 overflow-y-auto bg-slate-200 p-6"
        onMouseUp={captureSelection}
        onScroll={handleScroll}
      >
        {isLoading && <p className="mb-3 text-sm text-slate-600">Loading PPTX...</p>}

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div
          className="mx-auto flex max-w-5xl flex-col gap-8"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {slides.map((slide) => (
            <section
              key={slide.pageNumber}
              data-page={slide.pageNumber}
              className="relative min-h-[420px] rounded-lg border bg-white p-8 shadow"
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Slide {slide.pageNumber}
              </p>
              <h2 className="mb-6 text-2xl font-semibold text-slate-900">
                {slide.title || `Slide ${slide.pageNumber}`}
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-slate-700">
                {(slide.textBlocks.length > 0
                  ? slide.textBlocks
                  : ["No text extracted from this slide."]).map((block, index) => (
                  <p key={`${slide.pageNumber}-${index}`}>{block}</p>
                ))}
              </div>

              {activeHighlight && activeHighlightPage === slide.pageNumber && (
                <div
                  className="pointer-events-none absolute border"
                  style={{
                    borderColor: activeHighlightColor,
                    backgroundColor: `${activeHighlightColor}66`,
                    left: `${activeHighlight.normalizedX * 100}%`,
                    top: `${activeHighlight.normalizedY * 100}%`,
                    width: `${Math.max(activeHighlight.normalizedWidth * 100, 1)}%`,
                    height: `${Math.max(activeHighlight.normalizedHeight * 100, 0.7)}%`,
                  }}
                />
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
