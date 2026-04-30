export type AnnotationStyle = "highlight" | "outline";

const STYLE_PREFIX = "[[style:";

export function encodeStyledComment(
  comment: string,
  style: AnnotationStyle,
): string {
  return `${STYLE_PREFIX}${style}]] ${comment.trim()}`;
}

export function decodeStyledComment(rawComment: string): {
  style: AnnotationStyle;
  comment: string;
} {
  if (!rawComment.startsWith(STYLE_PREFIX)) {
    return { style: "highlight", comment: rawComment };
  }

  const end = rawComment.indexOf("]]");
  if (end < 0) {
    return { style: "highlight", comment: rawComment };
  }

  const styleToken = rawComment.slice(STYLE_PREFIX.length, end).trim();
  const style: AnnotationStyle =
    styleToken === "outline" ? "outline" : "highlight";
  const comment = rawComment.slice(end + 2).trim();

  return {
    style,
    comment,
  };
}
