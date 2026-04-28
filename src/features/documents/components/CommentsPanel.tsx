"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentAnnotation } from "../types/annotation";
import { SelectionPayload } from "./pdf-viewer/types";
import {
  createAnnotation,
  fetchAnnotations,
  fetchMockAutoAnnotations,
  MockAutoAnnotation,
} from "../services/annotation-api";
import { useMe } from "@/features/auth/hooks/useMe";
import { toast } from "sonner";
import { locatePdfMatch } from "../services/pdf-match-locator";

type GroupedComments = Record<number, DocumentAnnotation[]>;
const HIGHLIGHT_COLORS = [
  "#fef08a",
  "#bfdbfe",
  "#bbf7d0",
  "#fecaca",
  "#e9d5ff",
  "#fdba74",
] as const;
const COLOR_BY_NAME: Record<MockAutoAnnotation["color"], string> = {
  RED: "#ef4444",
  BLUE: "#3b82f6",
  GREEN: "#22c55e",
};

export default function CommentsPanel({
  documentId,
  fileUrl,
  currentPage,
  pendingSelection,
  onConsumeSelection,
  onHoverAnnotationChange,
  onCommentClick,
}: {
  documentId: string;
  fileUrl: string;
  currentPage: number;
  pendingSelection: SelectionPayload | null;
  onConsumeSelection?: () => void;
  onHoverAnnotationChange?: (annotation: DocumentAnnotation | null) => void;
  onCommentClick?: (page: number) => void;
}) {
  const { data: currentUser } = useMe();
  const [comments, setComments] = useState<DocumentAnnotation[]>([]);
  const [input, setInput] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(HIGHLIGHT_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingMock, setIsApplyingMock] = useState(false);

  

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const items = await fetchAnnotations(documentId);
        if (isMounted) {
          setComments(items);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const addComment = async () => {
    if (!pendingSelection || !input.trim()) return;
    if (isSaving) return;

    setIsSaving(true);

    try {
      const newComment = await createAnnotation(documentId, {
        comment: input.trim(),
        quotedText: pendingSelection.text,
        highlightColor: selectedColor,
        page: pendingSelection.pageNumber,
        x: pendingSelection.x,
        y: pendingSelection.y,
        width: pendingSelection.width,
        height: pendingSelection.height,
        normalizedX: pendingSelection.normalizedX,
        normalizedY: pendingSelection.normalizedY,
        normalizedWidth: pendingSelection.normalizedWidth,
        normalizedHeight: pendingSelection.normalizedHeight,
      });

      setComments((prev) => [...prev, newComment]);
      setInput("");
      onConsumeSelection?.();
    } finally {
      setIsSaving(false);
    }
  };

  const groupedComments = useMemo(() => {
    const map: GroupedComments = {};

    comments.forEach((comment) => {
      if (!map[comment.page]) {
        map[comment.page] = [];
      }
      map[comment.page].push(comment);
    });

    return map;
  }, [comments]);

  const sortedPages = Object.keys(groupedComments)
    .map(Number)
    .sort((a, b) => a - b);

  const applyMockApi = async () => {
    if (!pendingSelection || isApplyingMock) return;

    setIsApplyingMock(true);
    try {
      const mockItems = await fetchMockAutoAnnotations(documentId, {
        selectedText: pendingSelection.text,
      });

      const created: DocumentAnnotation[] = [];
      for (const item of mockItems) {
        const resolvedSelection = await locatePdfMatch(fileUrl, item.pageNumber, item.text);
        if (!resolvedSelection) {
          continue;
        }

        const saved = await createAnnotation(documentId, {
          comment: `Ref: ${item.documentRef}`,
          quotedText: item.text,
          highlightColor: COLOR_BY_NAME[item.color] ?? HIGHLIGHT_COLORS[0],
          page: resolvedSelection.pageNumber,
          x: resolvedSelection.x,
          y: resolvedSelection.y,
          width: resolvedSelection.width,
          height: resolvedSelection.height,
          normalizedX: resolvedSelection.normalizedX,
          normalizedY: resolvedSelection.normalizedY,
          normalizedWidth: resolvedSelection.normalizedWidth,
          normalizedHeight: resolvedSelection.normalizedHeight,
        });

        created.push(saved);
      }

      if (created.length) {
        setComments((prev) => [...prev, ...created]);
        onHoverAnnotationChange?.(created[created.length - 1]);
      } else {
        toast.info("No reference found for the selected text.");
      }
      onConsumeSelection?.();
    } catch {
      toast.error("Unable to fetch references right now. Please try again.");
    } finally {
      setIsApplyingMock(false);
    }
  };


  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="font-semibold mb-2">Comments (Page {currentPage})</h2>

      <div className="mb-3 rounded border bg-gray-50 p-2">
        <p className="text-xs font-semibold text-gray-500">Selected Text</p>
        <p className="mt-1 text-sm text-gray-700 min-h-10">
          {pendingSelection
            ? `\u201c${pendingSelection.text}\u201d`
            : "Select text in the document to annotate."}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            pendingSelection
              ? `Add annotation for Page ${pendingSelection.pageNumber}`
              : "Select text first"
          }
          disabled={!pendingSelection}
        />
        <button
          onClick={addComment}
          disabled={!pendingSelection || !input.trim() || isSaving}
          className="bg-blue-500 text-white px-3 py-1 rounded disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isSaving ? "Adding..." : "Add"}
        </button>
        <button
          onClick={applyMockApi}
          disabled={!pendingSelection || isApplyingMock}
          className="bg-emerald-600 text-white px-3 py-1 rounded disabled:bg-emerald-300 disabled:cursor-not-allowed"
        >
          {isApplyingMock ? "Finding..." : "Find Ref"}
        </button>
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">Highlight Color</p>
        <div className="flex gap-2 flex-wrap">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-6 w-6 rounded-full border ${
                selectedColor === color ? "ring-2 ring-offset-1 ring-slate-500" : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Select ${color} highlight`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading && (
          <p className="text-sm text-gray-500">Loading annotations...</p>
        )}

        {sortedPages.length === 0 ? (
          <p className="text-sm text-gray-500">No annotations yet.</p>
        ) : (
          sortedPages.map((page) => (
            <div key={page}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500">
                  Page {page}
                </p>
                <button
                  onClick={() => onCommentClick?.(page)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Go to page
                </button>
              </div>

              <div className="space-y-2">
                {groupedComments[page].map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 border rounded bg-white shadow-sm"
                    style={{
                      borderLeft: `4px solid ${comment.highlightColor ?? HIGHLIGHT_COLORS[0]}`,
                    }}
                    onMouseEnter={() => onHoverAnnotationChange?.(comment)}
                    onMouseLeave={() => onHoverAnnotationChange?.(null)}
                    >
                    <p className="text-xs italic text-gray-500 mb-1">
                      {`\u201c${comment.quotedText}\u201d`}
                    </p>
                    <p className="text-sm">{comment.comment}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Author: {comment.authorName ?? currentUser?.name ?? "Unknown"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Color: {(comment.highlightColor ?? HIGHLIGHT_COLORS[0]).toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
