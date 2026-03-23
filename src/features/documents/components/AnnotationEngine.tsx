"use client";

import React, { useState, useRef, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import { cn } from "@/lib/utils";
import { LogOut, MessageSquare, User } from "lucide-react";

// --- Types ---
interface PageHighlight {
  pageNumber: number;
  top: number; // 0-1
  left: number; // 0-1
  width: number; // 0-1
  height: number; // 0-1
}

interface Annotation {
  id: string;
  comment: string;
  quotedText: string;
  visuals: PageHighlight[];
  author: string;
}

// --- Main Component ---
export function AnnotationEngine({ fileUrl }: { fileUrl: string }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Logic: Capture Selection & Map to Page
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString();

    // Find which page the selection started in
    const startNode = range.startContainer.parentElement;
    const pageElement = startNode?.closest("[data-page-number]");

    if (!pageElement) return;

    const pageNum = parseInt(
      pageElement.getAttribute("data-page-number") || "1",
    );
    const pageRect = pageElement.getBoundingClientRect();
    const selectionRect = range.getBoundingClientRect();

    // 🛡️ Normalization: Calculate % relative to the specific page
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      comment: "",
      quotedText: text,
      author: "Senior Dev",
      visuals: [
        {
          pageNumber: pageNum,
          top: (selectionRect.top - pageRect.top) / pageRect.height,
          left: (selectionRect.left - pageRect.left) / pageRect.width,
          width: selectionRect.width / pageRect.width,
          height: selectionRect.height / pageRect.height,
        },
      ],
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    selection.removeAllRanges(); // Clear selection for UX
  };

  return (
    <div className="flex h-[90vh] w-full bg-slate-50 overflow-hidden border rounded-xl shadow-2xl">
      {/* Sidebar: Annotations List */}
      <aside className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b font-bold flex items-center gap-2">
          <MessageSquare size={18} />
          <span>Comments ({annotations.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              onMouseEnter={() => setHoveredId(ann.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer",
                hoveredId === ann.id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-100 bg-slate-50",
              )}
            >
              <p className="text-xs italic text-slate-500 line-clamp-2 mb-2">
                "{ann.quotedText}"
              </p>
              <textarea
                className="w-full bg-transparent text-sm resize-none focus:outline-none"
                placeholder="Add your comment..."
                rows={2}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnnotations((prev) =>
                    prev.map((a) =>
                      a.id === ann.id ? { ...a, comment: val } : a,
                    ),
                  );
                }}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Main: Document Viewer */}
      <main
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-8 bg-slate-200"
      >
        {/* Page Placeholder (Repeat this for 150 pages with virtualization) */}
        {[1, 2].map((num) => (
          <div
            key={num}
            data-page-number={num}
            className="relative bg-white shadow-lg w-[600px] h-[800px] flex-shrink-0 select-text"
          >
            <div className="p-10 text-slate-300 text-lg">
              {/* This is where PDF.js would render. 
                  For POC, select this dummy text to trigger annotation */}
              [Page {num}] This is sample text to demonstrate cross-layer
              annotation logic. Select any part of this text to create a comment
              in the sidebar. Notice how hovering the sidebar highlight appears
              here.
            </div>

            {/* 📍 The Highlight Layer */}
            {annotations.map((ann) =>
              ann.visuals
                .filter((v) => v.pageNumber === num)
                .map((box, i) => (
                  <div
                    key={`${ann.id}-${i}`}
                    className={cn(
                      "absolute pointer-events-none transition-opacity duration-200",
                      hoveredId === ann.id
                        ? "opacity-100 bg-blue-400/30 border border-blue-500"
                        : "opacity-0",
                    )}
                    style={{
                      top: `${box.top * 100}%`,
                      left: `${box.left * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                    }}
                  />
                )),
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
