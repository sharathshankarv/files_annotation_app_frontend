"use client";

import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { PAGE_CONFIG } from "@/utils/constants";
import { PAGE_GAP, PAGE_WIDTH } from "./constants";

type Params = {
  numPages: number;
  scale: number;
  rotation: number;
  currentPage: number;
  containerRef: RefObject<HTMLDivElement | null>;
  onPageChange: (page: number) => void;
};

export function useVirtualPdfPages({
  numPages,
  scale,
  rotation,
  currentPage,
  containerRef,
  onPageChange,
}: Params) {
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 1 });
  const [pageRatios, setPageRatios] = useState<Record<number, number>>({});
  const [pageErrors, setPageErrors] = useState<Record<number, string>>({});
  const { PAGE_HEIGHT, BUFFER } = PAGE_CONFIG;

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
    [containerRef, numPages, pageOffsets],
  );

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
  }, [BUFFER, containerRef, currentPage, findPageByOffset, numPages, onPageChange]);

  const visiblePages = useMemo(() => {
    if (!numPages) return [];

    const pages: number[] = [];
    for (let page = visibleRange.start; page <= visibleRange.end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [numPages, visibleRange.end, visibleRange.start]);

  const updatePageRatio = useCallback((pageNumber: number, ratio: number) => {
    setPageRatios((previous) => {
      if (previous[pageNumber] === ratio) {
        return previous;
      }

      return {
        ...previous,
        [pageNumber]: ratio,
      };
    });
  }, []);

  const markPageError = useCallback((pageNumber: number, message: string) => {
    setPageErrors((previous) => ({
      ...previous,
      [pageNumber]: message,
    }));
  }, []);

  const clearPageError = useCallback((pageNumber: number) => {
    setPageErrors((previous) => {
      if (!previous[pageNumber]) {
        return previous;
      }

      const next = { ...previous };
      delete next[pageNumber];
      return next;
    });
  }, []);

  const initializePages = useCallback((totalPages: number) => {
    setVisibleRange({ start: 1, end: Math.min(totalPages, 4) });
    setPageRatios({});
    setPageErrors({});
  }, []);

  return {
    visiblePages,
    pageOffsets,
    totalHeight,
    pageErrors,
    scrollToPage,
    updatePageRatio,
    markPageError,
    clearPageError,
    initializePages,
  };
}
