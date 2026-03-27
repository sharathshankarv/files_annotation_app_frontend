import { AxiosError } from "axios";
import { BaseApiError } from "@/types/api";

const FALLBACK_ERROR_MESSAGE =
  "Unexpected error occurred. Please try again.";

export function normalizeApiError(error: unknown): string {
  if (!error) {
    return FALLBACK_ERROR_MESSAGE;
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as BaseApiError | undefined;
    const message = payload?.message;

    if (Array.isArray(message) && message.length > 0) {
      return message[0];
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
}
