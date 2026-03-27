import { useState } from 'react';
import { api } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { UPLOAD_CONFIG } from '@/utils/constants';

export function useFileUpload(onSuccess: (data: any) => void) {
  const [state, setState] = useState({
    uploading: false,
    progress: 0,
    isSuccess: false,
    error: null as string | null,
  });

  const upload = async (file: File) => {
    setState((s) => ({ ...s, uploading: true, error: null }));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(
        API_ENDPOINTS.DOCUMENTS.UPLOAD,
        formData,
        {
          onUploadProgress: (p) => {
            const percent = Math.round((p.loaded * 100) / (p.total || 1));
            setState((s) => ({ ...s, progress: percent }));
          },
        },
      );

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
    } catch (err: any) {
      setState((s) => ({ ...s, uploading: false, error: err.message }));
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
  };
}
