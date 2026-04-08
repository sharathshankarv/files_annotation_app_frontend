export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/users/me",
  },
  DOCUMENTS: {
    BASE: "/uploads",
    UPLOAD: "/uploads/document",
    ANNOTATIONS: (id: string) => `/uploads/${id}/annotations`,
    DOWNLOAD: (id: string) => `/uploads/${id}/download`,
    VERIFY: (id: string) => `/files/verify/${id}`,
  },
  WORKSPACE: {
    BASE: "/workspace",
  },
} as const;
