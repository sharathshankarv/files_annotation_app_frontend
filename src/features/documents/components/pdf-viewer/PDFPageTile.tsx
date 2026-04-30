import { Page } from "react-pdf";
import {
  ACTIVE_PAGE_DPR,
  DISTANT_PAGE_DPR,
  NEARBY_PAGE_DPR,
  PAGE_WIDTH,
} from "./constants";
import { DocumentAnnotation } from "../../types/annotation";
import { decodeStyledComment } from "../../services/annotation-style";

type Props = {
  pageNumber: number;
  currentPage: number;
  pageTop: number;
  scale: number;
  rotation: number;
  errorMessage?: string;
  onRenderError: (pageNumber: number, message: string) => void;
  onRenderSuccess: (pageNumber: number, ratio: number) => void;
  pageAnnotations: DocumentAnnotation[];
  hoveredAnnotation: DocumentAnnotation | null;
};

function getPageDpr(pageNumber: number, currentPage: number) {
  const distance = Math.abs(pageNumber - currentPage);

  if (distance === 0) return ACTIVE_PAGE_DPR;
  if (distance <= 2) return NEARBY_PAGE_DPR;
  return DISTANT_PAGE_DPR;
}

function shouldRenderTextLayer(pageNumber: number, currentPage: number) {
  // Keep text selectable on the active/nearby pages without paying full cost
  // for every virtualized page window entry.
  return Math.abs(pageNumber - currentPage) <= 1;
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
  pageAnnotations,
  hoveredAnnotation,
}: Props) {
  return (
    <div
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
        <div data-page={pageNumber} className="relative mx-auto w-fit">
          <Page
            pageNumber={pageNumber}
            width={PAGE_WIDTH}
            scale={scale}
            rotate={rotation}
            devicePixelRatio={getPageDpr(pageNumber, currentPage)}
            renderMode="canvas"
            renderAnnotationLayer={false}
            renderTextLayer={shouldRenderTextLayer(pageNumber, currentPage)}
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
          {pageAnnotations.map((annotation) => {
            const isHovered = hoveredAnnotation?.id === annotation.id;
            const style = annotation.annotationStyle ?? decodeStyledComment(annotation.comment).style;
            const baseColor = annotation.highlightColor ?? "#3b82f6";
            return (
              <div
                key={annotation.id}
                className="pointer-events-none absolute shadow-sm"
                style={{
                  border: `${isHovered ? 2 : 1}px solid ${baseColor}`,
                  backgroundColor:
                    style === "outline"
                      ? "transparent"
                      : `${baseColor}${isHovered ? "77" : "44"}`,
                  left: `${annotation.normalizedX * 100}%`,
                  top: `${annotation.normalizedY * 100}%`,
                  width: `${Math.max(annotation.normalizedWidth * 100, 4)}%`,
                  height: `${Math.max(annotation.normalizedHeight * 100, 2)}%`,
                  minHeight: 12,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
