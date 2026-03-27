import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { normalizeApiError } from '@/lib/error-utils';
import { UPLOAD_CONFIG } from '@/utils/constants';
import { UploadDocumentResponse } from '../types/upload';

export function useFileUpload(
  onSuccess: (data: UploadDocumentResponse) => void,
) {
  type UploadResult =
    | { ok: true }
    | {
        ok: false;
        reason:
          | "no_file"
          | "invalid_type"
          | "too_large"
          | "invalid_response"
          | "request_failed";
      };

  const [state, setState] = useState({
    uploading: false,
    progress: 0,
    isSuccess: false,
    error: null as string | null,
  });

  const upload = async (file: File | null): Promise<UploadResult> => {
    if (!file) {
      toast.error(UPLOAD_CONFIG.STANDARD_ERRORS.NO_FILE_SELECTED, {
        duration: UPLOAD_CONFIG.ERROR_TOAST_DURATION_MS,
      });
      setState((s) => ({
        ...s,
        error: UPLOAD_CONFIG.STANDARD_ERRORS.NO_FILE_SELECTED,
      }));
      return { ok: false, reason: "no_file" };
    }

    if (!UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(UPLOAD_CONFIG.STANDARD_ERRORS.INVALID_FILE_TYPE, {
        duration: UPLOAD_CONFIG.ERROR_TOAST_DURATION_MS,
      });
      setState((s) => ({
        ...s,
        error: UPLOAD_CONFIG.STANDARD_ERRORS.INVALID_FILE_TYPE,
      }));
      return { ok: false, reason: "invalid_type" };
    }

    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
      toast.error(UPLOAD_CONFIG.STANDARD_ERRORS.FILE_TOO_LARGE, {
        duration: UPLOAD_CONFIG.ERROR_TOAST_DURATION_MS,
      });
      setState((s) => ({
        ...s,
        error: UPLOAD_CONFIG.STANDARD_ERRORS.FILE_TOO_LARGE,
      }));
      return { ok: false, reason: "too_large" };
    }

    setState((s) => ({ ...s, uploading: true, error: null }));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<UploadDocumentResponse>(
        API_ENDPOINTS.DOCUMENTS.UPLOAD,
        formData,
        {
          onUploadProgress: (p) => {
            const percent = Math.round((p.loaded * 100) / (p.total || 1));
            setState((s) => ({ ...s, progress: percent }));
          },
        },
      );

      if (!response.data?.documentId) {
        throw new Error(UPLOAD_CONFIG.STANDARD_ERRORS.INVALID_RESPONSE);
      }

      setState((s) => ({
        ...s,
        progress: 100,
        isSuccess: true,
        uploading: false,
      }));

      setTimeout(() => {
        setState({
          uploading: false,
          progress: 0,
          isSuccess: false,
          error: null,
        });

        onSuccess(response.data);
      }, UPLOAD_CONFIG.POST_UPLOAD_SUCCESS_DELAY_MS);
      return { ok: true };
    } catch (err: unknown) {
      const normalizedMessage = normalizeApiError(err);
      const isInvalidResponse =
        normalizedMessage === UPLOAD_CONFIG.STANDARD_ERRORS.INVALID_RESPONSE;
      const errorMessage =
        normalizedMessage || UPLOAD_CONFIG.STANDARD_ERRORS.UNEXPECTED;

      toast.error(errorMessage, {
        duration: UPLOAD_CONFIG.ERROR_TOAST_DURATION_MS,
      });

      setState((s) => ({
        ...s,
        uploading: false,
        error: errorMessage,
      }));
      return {
        ok: false,
        reason: isInvalidResponse ? "invalid_response" : "request_failed",
      };
    }
  };

  return {
    upload,
    uploading: state.uploading,
    progress: state.progress,
    isSuccess: state.isSuccess,
    error: state.error,
    setIsSuccess: (value: boolean) =>
      setState((s) => ({ ...s, isSuccess: value })),
    setProgress: (value: number) =>
      setState((s) => ({ ...s, progress: value })),
    clearError: () => setState((s) => ({ ...s, error: null })),
  };
}
