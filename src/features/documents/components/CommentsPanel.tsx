"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentAnnotation } from "../types/annotation";
import { SelectionPayload } from "./pdf-viewer/types";
import {
  loadAnnotations,
  saveAnnotations,
} from "../services/annotation-storage";

type GroupedComments = Record<number, DocumentAnnotation[]>;

export default function CommentsPanel({
  documentId,
  currentPage,
  pendingSelection,
  onConsumeSelection,
  onCommentClick,
}: {
  documentId: string;
  currentPage: number;
  pendingSelection: SelectionPayload | null;
  onConsumeSelection?: () => void;
  onCommentClick?: (page: number) => void;
}) {
  const [comments, setComments] = useState<DocumentAnnotation[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setComments(loadAnnotations(documentId));
  }, [documentId]);

  useEffect(() => {
    saveAnnotations(documentId, comments);
  }, [comments, documentId]);

  const addComment = () => {
    if (!pendingSelection || !input.trim()) return;

    const newComment: DocumentAnnotation = {
      id: crypto.randomUUID(),
      comment: input.trim(),
      quotedText: pendingSelection.text,
      page: pendingSelection.pageNumber,
      x: pendingSelection.x,
      y: pendingSelection.y,
      normalizedX: pendingSelection.normalizedX,
      normalizedY: pendingSelection.normalizedY,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    setInput("");
    onConsumeSelection?.();
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

  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="font-semibold mb-2">Comments (Page {currentPage})</h2>

      <div className="mb-3 rounded border bg-gray-50 p-2">
        <p className="text-xs font-semibold text-gray-500">Selected Text</p>
        <p className="mt-1 text-sm text-gray-700 min-h-10">
          {pendingSelection
            ? `"${pendingSelection.text}"`
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
          disabled={!pendingSelection || !input.trim()}
          className="bg-blue-500 text-white px-3 py-1 rounded disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
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
                    className="p-2 border rounded bg-white shadow-sm"
                  >
                    <p className="text-xs italic text-gray-500 mb-1">
                      "{comment.quotedText}"
                    </p>
                    <p className="text-sm">{comment.comment}</p>
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
