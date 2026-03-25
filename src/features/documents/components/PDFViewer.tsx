"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCookie } from "cookies-next";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuthStore } from "@/store/useAuthStore";
import { APP_CONFIG } from "@/utils/constants";
import { PAGE_CONFIG } from "@/utils/constants";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PAGE_WIDTH = 600;
const PAGE_GAP = 24;
const RANGE_CHUNK_SIZE = 64 * 1024;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const ACTIVE_PAGE_DPR = 1;
const NEARBY_PAGE_DPR = 0.8;
const DISTANT_PAGE_DPR = 0.6;

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
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 1 });
  const [pageRatios, setPageRatios] = useState<Record<number, number>>({});
  const [pageErrors, setPageErrors] = useState<Record<number, string>>({});
  const { PAGE_HEIGHT, BUFFER } = PAGE_CONFIG;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const storeToken = useAuthStore((state) => state.token);

  const activeToken = useMemo(
    () =>
      storeToken ||
      (getCookie(APP_CONFIG.COOKIE_NAME) as string | undefined) ||
      (getCookie(`__Secure-${APP_CONFIG.COOKIE_NAME}`) as string | undefined) ||
      null,
    [storeToken],
  );

  const fileConfig = useMemo(() => {
    const baseConfig = {
      url: fileUrl,
      withCredentials: false,
      disableAutoFetch: true,
      disableStream: true,
      disableRange: false,
      rangeChunkSize: RANGE_CHUNK_SIZE,
    };

    if (!activeToken) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      httpHeaders: {
        Authorization: `Bearer ${activeToken}`,
      },
    };
  }, [activeToken, fileUrl]);

  const fallbackPageHeight = useMemo(() => {
    const isSideways = rotation % 180 !== 0;
    const renderedHeight = isSideways
      ? PAGE_WIDTH * scale
      : PAGE_HEIGHT * scale;

    return renderedHeight + PAGE_GAP;
  }, [PAGE_HEIGHT, rotation, scale]);

  const computedPageHeights = useMemo(() => {
    if (!numPages) return [];

    return Array.from({ length: numPages }, (_, index) => {
      const pageNumber = index + 1;
      const ratio = pageRatios[pageNumber];

      if (!ratio) {
        return fallbackPageHeight;
      }

      const baseHeight = PAGE_WIDTH * ratio * scale;
      const rotatedHeight =
        rotation % 180 === 0 ? baseHeight : (PAGE_WIDTH / ratio) * scale;

      return rotatedHeight + PAGE_GAP;
    });
  }, [fallbackPageHeight, numPages, pageRatios, rotation, scale]);

  const pageOffsets = useMemo(() => {
    if (!numPages) return [0];

    const offsets = new Array(numPages + 1).fill(0);

    for (let index = 1; index <= numPages; index += 1) {
      offsets[index] = offsets[index - 1] + computedPageHeights[index - 1];
    }

    return offsets;
  }, [computedPageHeights, numPages]);

  const totalHeight = pageOffsets[numPages] ?? 0;

  const findPageByOffset = useCallback(
    (offset: number) => {
      if (!numPages) return 1;

      let left = 1;
      let right = numPages;
      let candidate = 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const start = pageOffsets[mid - 1];
        const end = pageOffsets[mid];

        if (offset >= start && offset < end) {
          return mid;
        }

        if (offset < start) {
          right = mid - 1;
        } else {
          candidate = mid;
          left = mid + 1;
        }
      }

      return Math.min(Math.max(candidate, 1), numPages);
    },
    [numPages, pageOffsets],
  );

  const scrollToPage = useCallback(
    (page: number) => {
      const container = containerRef.current;
      if (!container || !numPages) return;

      const safePage = Math.min(Math.max(page, 1), numPages);
      const top = pageOffsets[safePage - 1] ?? 0;

      container.scrollTo({
        top,
        behavior: "smooth",
      });
    },
    [numPages, pageOffsets],
  );

  useEffect(() => {
    if (!onReady || !numPages) return;

    onReady({
      scrollToPage,
    });
  }, [numPages, onReady, scrollToPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !numPages) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const viewportStart = Math.max(0, scrollTop);
      const viewportCenter = viewportStart + containerHeight / 2;
      const viewportEnd = viewportStart + containerHeight;

      const centeredPage = findPageByOffset(viewportCenter);
      const startPage = Math.max(1, findPageByOffset(viewportStart) - BUFFER);
      const endPage = Math.min(numPages, findPageByOffset(viewportEnd) + BUFFER);

      setVisibleRange((previous) => {
        if (previous.start === startPage && previous.end === endPage) {
          return previous;
        }

        return { start: startPage, end: endPage };
      });

      if (centeredPage !== currentPage) {
        onPageChange(centeredPage);
      }
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [BUFFER, currentPage, findPageByOffset, numPages, onPageChange]);

  const visiblePages = useMemo(() => {
    if (!numPages) return [];

    const pages: number[] = [];
    for (let page = visibleRange.start; page <= visibleRange.end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [numPages, visibleRange.end, visibleRange.start]);

  const getPageDpr = (pageNumber: number) => {
    const distance = Math.abs(pageNumber - currentPage);

    if (distance === 0) return ACTIVE_PAGE_DPR;
    if (distance <= 2) return NEARBY_PAGE_DPR;
    return DISTANT_PAGE_DPR;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white p-2 shadow-sm">
        <div className="text-sm text-gray-600">Page {currentPage}</div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setScale((value) => Math.min(MAX_SCALE, value + 0.2))
            }
            className="rounded bg-gray-100 px-3 py-1"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() =>
              setScale((value) => Math.max(MIN_SCALE, value - 0.2))
            }
            className="rounded bg-gray-100 px-3 py-1"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setRotation((value) => (value + 90) % 360)}
            className="rounded bg-gray-100 px-3 py-1"
            aria-label="Rotate document"
          >
            Rotate
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        <Document
          file={fileConfig}
          loading={<p className="text-sm text-gray-500">Loading PDF...</p>}
          onLoadError={(error) => setLoadError(error.message)}
          onLoadSuccess={({ numPages: loadedPages }) => {
            setLoadError(null);
            setNumPages(loadedPages);
            setVisibleRange({ start: 1, end: Math.min(loadedPages, 4) });
            setPageRatios({});
            setPageErrors({});
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
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  className={`absolute left-0 right-0 rounded-lg transition-all duration-200 ${
                    currentPage === pageNumber
                      ? "ring-4 ring-blue-400 shadow-xl"
                      : "opacity-90"
                  }`}
                  style={{
                    top: pageOffsets[pageNumber - 1] ?? 0,
                  }}
                >
                  {pageErrors[pageNumber] ? (
                    <div className="min-h-[300px] rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="font-medium">Page {pageNumber} failed to render.</p>
                      <p className="mt-1">Try zooming out. Heavy image pages may need lower render quality.</p>
                    </div>
                  ) : (
                    <Page
                      pageNumber={pageNumber}
                      width={PAGE_WIDTH}
                      scale={scale}
                      rotate={rotation}
                      devicePixelRatio={getPageDpr(pageNumber)}
                      renderMode="canvas"
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      loading={
                        <div className="min-h-[280px] animate-pulse rounded bg-slate-100" />
                      }
                      onRenderError={(error) => {
                        setPageErrors((previous) => ({
                          ...previous,
                          [pageNumber]:
                            error instanceof Error ? error.message : "Render failed",
                        }));
                      }}
                      onRenderSuccess={(pageProxy) => {
                        setPageErrors((previous) => {
                          if (!previous[pageNumber]) {
                            return previous;
                          }

                          const next = { ...previous };
                          delete next[pageNumber];
                          return next;
                        });

                        const [x1, y1, x2, y2] = pageProxy.view;
                        const width = Math.abs(x2 - x1) || 1;
                        const height = Math.abs(y2 - y1) || 1;
                        const ratio = height / width;

                        setPageRatios((previous) => {
                          if (previous[pageNumber] === ratio) {
                            return previous;
                          }

                          return {
                            ...previous,
                            [pageNumber]: ratio,
                          };
                        });
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Document>
      </div>
    </div>
  );
}
