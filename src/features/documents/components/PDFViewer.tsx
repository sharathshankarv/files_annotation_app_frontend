"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// ✅ Use local worker (NO CDN issues)
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

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ✅ Scroll to page (exposed to parent)
  const scrollToPage = (page: number) => {
    pageRefs.current[page - 1]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // ✅ Expose API to parent
  useEffect(() => {
    if (!onReady || !numPages) return;

    onReady({
      scrollToPage,
    });
  }, [numPages]);

  // ✅ Intersection Observer (MOST VISIBLE PAGE)
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const visibilityMap = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const page = Number(entry.target.getAttribute("data-page"));
          visibilityMap.set(page, entry.intersectionRatio);
        });

        // 🔥 Find MOST visible page
        let maxRatio = 0;
        let visiblePage = currentPage;

        visibilityMap.forEach((ratio, page) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            visiblePage = page;
          }
        });

        if (visiblePage !== currentPage) {
          console.log("🔥 Active page:", visiblePage);
          onPageChange(visiblePage);
        }
      },
      {
        root: containerRef.current,
        threshold: Array.from({ length: 11 }, (_, i) => i / 10), // 0 → 1
      },
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [numPages, currentPage]);

  return (
    <div className="h-full flex flex-col">
      {/* 🔥 Toolbar */}
      <div className="sticky top-0 z-20 bg-white border-b p-2 flex justify-between items-center shadow-sm">
        <div className="text-sm text-gray-600">Page {currentPage}</div>

        <div className="flex gap-2">
          <button
            onClick={() => setScale((s) => s + 0.2)}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            +
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            -
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            ⟳
          </button>
        </div>
      </div>

      {/* 🔥 Scrollable PDF */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              data-page={i + 1}
              className={`transition-all duration-200 rounded-lg ${
                currentPage === i + 1
                  ? "ring-4 ring-blue-400 shadow-xl"
                  : "opacity-90"
              }`}
            >
              <Page
                pageNumber={i + 1}
                scale={scale}
                rotate={rotation}
                width={600}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
