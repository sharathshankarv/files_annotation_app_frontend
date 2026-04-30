export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/users/me",
  },
  DOCUMENTS: {
    LIST: "/documents",
    BASE: "/uploads",
    UPLOAD: "/uploads/document",
    ANNOTATIONS: (id: string) => `/uploads/${id}/annotations`,
    ANNOTATION_BY_ID: (id: string, annotationId: string) =>
      `/uploads/${id}/annotations/${annotationId}`,
    MOCK_AUTO_ANNOTATIONS: (id: string) => `/uploads/${id}/mock-auto-annotations`,
    MOCK_FULL_DOC_REFERENCES: (id: string) => `/uploads/${id}/mock-full-doc-references`,
    DOWNLOAD: (id: string) => `/uploads/${id}/download`,
    PPT_SLIDES: (id: string) => `/uploads/${id}/ppt/slides`,
    VERIFY: (id: string) => `/files/verify/${id}`,
  },
  WORKSPACE: {
    BASE: "/workspace",
  },
} as const;
