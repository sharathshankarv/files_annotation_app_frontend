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
  comment: string;
  quotedText: string;
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
};
