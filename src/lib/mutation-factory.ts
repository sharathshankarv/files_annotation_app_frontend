import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ApiAxiosError } from "@/types/api";
import { APP_CONFIG } from "@/utils/constants";

interface ExtraOptions<TData> {
  mock?: TData; // Optional mock data
}

export function useAppMutation<TData, TVariables>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST", // Default to POST for mutations
  options?: UseMutationOptions<TData, ApiAxiosError, TVariables, unknown> &
    ExtraOptions<TData>,
) {
  return useMutation<TData, ApiAxiosError, TVariables, unknown>({
    mutationFn: async (variables) => {
      // 1. Mock Logic: If global mocking is on OR this specific call has a mock
      if (APP_CONFIG.ENABLE_MOCKS || options?.mock) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
        return options?.mock as TData;
      }

      // 2. Real API Logic
      const { data } = await api.request<TData>({
        url,
        method,
        data: variables,
      });
      return data;
    },
    ...options,
    onError: (...args) => {
      const [error] = args;
      const message = error.response?.data.message;
      const displayMessage = Array.isArray(message) ? message[0] : message;
      toast.error(displayMessage || "Operation failed");

      if (options?.onError) {
        options.onError(...args);
      }
    },
  });
}
