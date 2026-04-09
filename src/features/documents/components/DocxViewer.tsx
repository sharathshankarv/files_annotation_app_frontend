"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { api } from "@/lib/api-client";
import { SelectionPayload } from "./pdf-viewer/types";
import { DocumentAnnotation } from "../types/annotation";

export default function DocxViewer({
  fileUrl,
  onPageChange,
  onReady,
  onSelectionChange,
  hoveredAnnotation,
  pendingSelection,
  persistedSelection,
}: {
  fileUrl: string;
  onPageChange: (page: number) => void;
  onReady?: (helpers: { scrollToPage: (page: number) => void }) => void;
  onSelectionChange?: (selection: SelectionPayload | null) => void;
  hoveredAnnotation?: DocumentAnnotation | null;
  pendingSelection?: SelectionPayload | null;
  persistedSelection?: SelectionPayload | null;
}) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hostContainerRef = useRef<HTMLDivElement | null>(null);
  const renderContainerRef = useRef<HTMLDivElement | null>(null);

  const getDocxPages = useCallback(() => {
    if (!renderContainerRef.current) return [];
    return Array.from(
      renderContainerRef.current.querySelectorAll<HTMLElement>(".docx-page"),
    );
  }, []);

  const resolvePageNumber = useCallback(
    (target: Element | null): number => {
      if (!target) return 1;

      const pageElement = target.closest(".docx-page") as HTMLElement | null;
      if (!pageElement) return 1;

      const pages = getDocxPages();
      const pageIndex = pages.findIndex((page) => page === pageElement);
      return pageIndex >= 0 ? pageIndex + 1 : 1;
    },
    [getDocxPages],
  );

  useEffect(() => {
    onPageChange(1);
  }, [onPageChange]);

  useEffect(() => {
    if (!onReady) return;

    onReady({
      scrollToPage: (page: number) => {
        const pages = getDocxPages();
        const targetIndex = Math.max(page - 1, 0);
        const targetPage = pages[targetIndex];

        if (targetPage) {
          targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
          onPageChange(targetIndex + 1);
          return;
        }

        hostContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        onPageChange(1);
      },
    });
  }, [getDocxPages, onPageChange, onReady]);

  useEffect(() => {
    let isMounted = true;

    const loadDocx = async () => {
      const targetContainer = renderContainerRef.current;
      if (!targetContainer) return;

      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await api.get<Blob>(fileUrl, {
          responseType: "blob",
        });

        targetContainer.innerHTML = "";
        const renderOptions = {
          className: "docx",
          inWrapper: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          renderComments: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          experimental: true,
          useBase64URL: true,
          trimXmlDeclaration: true,
          renderAltChunks: true,
        };

        try {
          await renderAsync(
            response.data,
            targetContainer,
            undefined,
            renderOptions,
          );
        } catch {
          const fallbackBuffer = await response.data.arrayBuffer();
          await renderAsync(
            fallbackBuffer,
            targetContainer,
            undefined,
            renderOptions,
          );
        }

        if (isMounted) {
          onPageChange(1);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          setLoadError(`Failed to render DOCX preview. ${message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDocx();
    return () => {
      isMounted = false;
    };
  }, [fileUrl, onPageChange]);

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
    const rect = rects[0] ?? range.getBoundingClientRect();
    const startNode =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element);

    if (
      !renderContainerRef.current ||
      !startNode ||
      !renderContainerRef.current.contains(startNode)
    ) {
      onSelectionChange?.(null);
      return;
    }

    const containerRect = renderContainerRef.current.getBoundingClientRect();
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top + renderContainerRef.current.scrollTop;
    const width = rect.width;
    const height = rect.height;
    const pageNumber = resolvePageNumber(startNode);

    const normalizedX = Math.min(Math.max(x / Math.max(containerRect.width, 1), 0), 1);
    const normalizedY = Math.min(
      Math.max(y / Math.max(renderContainerRef.current.scrollHeight, 1), 0),
      1,
    );
    const normalizedWidth = Math.min(
      Math.max(width / Math.max(containerRect.width, 1), 0),
      1,
    );
    const normalizedHeight = Math.min(
      Math.max(height / Math.max(renderContainerRef.current.scrollHeight, 1), 0),
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
  }, [onPageChange, onSelectionChange, resolvePageNumber]);

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
        !renderContainerRef.current ||
        !startContainerElement ||
        !renderContainerRef.current.contains(startContainerElement)
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

  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);
  const activeHighlight =
    hoveredAnnotation ?? pendingSelection ?? persistedSelection ?? null;
  const activeHighlightColor =
    hoveredAnnotation?.highlightColor ??
    (persistedSelection ? "#fef08a" : pendingSelection ? "#fef08a" : "#fef08a");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end gap-2 border-b bg-white px-3 py-2">
        <button
          onClick={() =>
            setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))
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
            setZoom((value) => Math.min(2, Number((value + 0.1).toFixed(2))))
          }
          className="rounded border px-2 py-1 text-sm"
        >
          +
        </button>
      </div>

      <div
        ref={hostContainerRef}
        className="flex-1 overflow-y-auto bg-slate-200 p-6"
        onMouseUp={captureSelection}
      >
        {isLoading && (
          <p className="mb-3 text-sm text-slate-600">Loading DOCX...</p>
        )}

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="relative mx-auto min-h-full max-w-5xl overflow-auto">
          <div
            ref={renderContainerRef}
            className="docx-preview-host"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              visibility: loadError ? "hidden" : "visible",
              height: loadError ? 0 : "auto",
            }}
          />

          {activeHighlight && (
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
        </div>
      </div>
    </div>
  );
}
