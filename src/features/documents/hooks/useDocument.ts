'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { API_CONFIG } from '@/utils/constants';

export const useDocument = (documentId: string) => {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get(
          `${API_ENDPOINTS.DOCUMENTS.BASE}/${documentId}`,
        );

        const fullUrl = data.url.startsWith('http')
          ? data.url
          : `${API_CONFIG.BASE_URL}${data.url}`;

        setDoc({ ...data, url: fullUrl });
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to fetch document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  return { doc, loading, error };
};
