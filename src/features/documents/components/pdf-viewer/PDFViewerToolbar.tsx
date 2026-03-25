import { MAX_SCALE, MIN_SCALE } from "./constants";

type Props = {
  currentPage: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
};

export function PDFViewerToolbar({
  currentPage,
  onZoomIn,
  onZoomOut,
  onRotate,
}: Props) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white p-2 shadow-sm">
      <div className="text-sm text-gray-600">Page {currentPage}</div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onZoomIn}
          className="rounded bg-gray-100 px-3 py-1"
          aria-label={`Zoom in (max ${MAX_SCALE}x)`}
        >
          +
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="rounded bg-gray-100 px-3 py-1"
          aria-label={`Zoom out (min ${MIN_SCALE}x)`}
        >
          -
        </button>
        <button
          type="button"
          onClick={onRotate}
          className="rounded bg-gray-100 px-3 py-1"
          aria-label="Rotate document"
        >
          Rotate
        </button>
      </div>
    </div>
  );
}
