"use client";

import { useMemo, useState } from "react";

type Comment = {
  id: string;
  text: string;
  page: number;
};

export default function CommentsPanel({
  documentId,
  currentPage,
  onCommentClick,
}: {
  documentId: string;
  currentPage: number;
  onCommentClick?: (page: number) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");

  const addComment = () => {
    if (!input.trim()) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      text: input,
      page: currentPage,
    };

    setComments((prev) => [...prev, newComment]);
    setInput("");
  };

  // 🔥 GROUPING LOGIC
  const groupedComments = useMemo(() => {
    const map: Record<number, Comment[]> = {};

    comments.forEach((c) => {
      if (!map[c.page]) {
        map[c.page] = [];
      }
      map[c.page].push(c);
    });

    return map;
  }, [comments]);

  // 🔥 SORT PAGES ASC
  const sortedPages = Object.keys(groupedComments)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <h2 className="font-semibold mb-2">Comments (Page {currentPage})</h2>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add comment on Page ${currentPage}`}
        />
        <button
          onClick={addComment}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add
        </button>
      </div>

      {/* 🔥 Grouped Comments */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {sortedPages.map((page) => (
          <div key={page}>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-500">
                📄 Page {page}
              </p>
              <button
                onClick={() => onCommentClick?.(page)}
                className="text-xs text-blue-500 hover:underline"
              >
                Go to page
              </button>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              {groupedComments[page].map((c) => (
                <div
                  key={c.id}
                  className="p-2 border rounded bg-white shadow-sm"
                >
                  <p className="text-sm">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
