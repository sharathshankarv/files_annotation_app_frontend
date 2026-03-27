import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ApiAxiosError } from '@/types/api';
import { APP_CONFIG, MOCK_CONFIG } from '@/utils/constants';

interface ExtraOptions<TData> {
  mock?: TData;
}

export function useAppQuery<TData>(
  queryKey: QueryKey,
  url: string,
  options?: Omit<
    UseQueryOptions<TData, ApiAxiosError>,
    'queryKey' | 'queryFn'
  > &
    ExtraOptions<TData>,
) {
  return useQuery<TData, ApiAxiosError>({
    queryKey,
    queryFn: async () => {
      if (APP_CONFIG.ENABLE_MOCKS && options?.mock) {
        await new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.QUERY_DELAY_MS));
        return options.mock;
      }

      const { data } = await api.get<TData>(url);
      return data;
    },
    ...options,
  });
}
