import { Page } from "react-pdf";
import {
  ACTIVE_PAGE_DPR,
  DISTANT_PAGE_DPR,
  NEARBY_PAGE_DPR,
  PAGE_WIDTH,
} from "./constants";

type Props = {
  pageNumber: number;
  currentPage: number;
  pageTop: number;
  scale: number;
  rotation: number;
  errorMessage?: string;
  onRenderError: (pageNumber: number, message: string) => void;
  onRenderSuccess: (pageNumber: number, ratio: number) => void;
};

function getPageDpr(pageNumber: number, currentPage: number) {
  const distance = Math.abs(pageNumber - currentPage);

  if (distance === 0) return ACTIVE_PAGE_DPR;
  if (distance <= 2) return NEARBY_PAGE_DPR;
  return DISTANT_PAGE_DPR;
}

export function PDFPageTile({
  pageNumber,
  currentPage,
  pageTop,
  scale,
  rotation,
  errorMessage,
  onRenderError,
  onRenderSuccess,
}: Props) {
  return (
    <div
      data-page={pageNumber}
      className={`absolute left-0 right-0 rounded-lg transition-all duration-200 ${
        currentPage === pageNumber ? "ring-4 ring-blue-400 shadow-xl" : "opacity-90"
      }`}
      style={{ top: pageTop }}
    >
      {errorMessage ? (
        <div className="min-h-[300px] rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Page {pageNumber} failed to render.</p>
          <p className="mt-1">
            Try zooming out. Heavy image pages may need lower render quality.
          </p>
        </div>
      ) : (
        <Page
          pageNumber={pageNumber}
          width={PAGE_WIDTH}
          scale={scale}
          rotate={rotation}
          devicePixelRatio={getPageDpr(pageNumber, currentPage)}
          renderMode="canvas"
          renderAnnotationLayer={false}
          renderTextLayer={false}
          loading={<div className="min-h-[280px] animate-pulse rounded bg-slate-100" />}
          onRenderError={(error) =>
            onRenderError(
              pageNumber,
              error instanceof Error ? error.message : "Render failed",
            )
          }
          onRenderSuccess={(pageProxy) => {
            const [x1, y1, x2, y2] = pageProxy.view;
            const width = Math.abs(x2 - x1) || 1;
            const height = Math.abs(y2 - y1) || 1;
            const ratio = height / width;

            onRenderSuccess(pageNumber, ratio);
          }}
        />
      )}
    </div>
  );
}
