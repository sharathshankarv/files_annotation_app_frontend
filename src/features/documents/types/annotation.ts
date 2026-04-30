export type TextSelection = {
  pageNumber: number;
  text: string;
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
};

export type DocumentAnnotation = {
  id: string;
  authorName?: string;
  comment: string;
  quotedText: string;
  highlightColor?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;
  createdAt: string;
  annotationStyle?: "highlight" | "outline";
  displayComment?: string;
};
