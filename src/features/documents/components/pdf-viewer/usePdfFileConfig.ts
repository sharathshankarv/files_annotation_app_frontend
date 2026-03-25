"use client";

import { useMemo } from "react";
import { getCookie } from "cookies-next";
import { useAuthStore } from "@/store/useAuthStore";
import { APP_CONFIG } from "@/utils/constants";
import { RANGE_CHUNK_SIZE } from "./constants";

export function usePdfFileConfig(fileUrl: string) {
  const storeToken = useAuthStore((state) => state.token);

  const activeToken = useMemo(
    () =>
      storeToken ||
      (getCookie(APP_CONFIG.COOKIE_NAME) as string | undefined) ||
      (getCookie(`__Secure-${APP_CONFIG.COOKIE_NAME}`) as string | undefined) ||
      null,
    [storeToken],
  );

  return useMemo(() => {
    const baseConfig = {
      url: fileUrl,
      withCredentials: false,
      disableAutoFetch: true,
      disableStream: true,
      disableRange: false,
      rangeChunkSize: RANGE_CHUNK_SIZE,
    };

    if (!activeToken) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      httpHeaders: {
        Authorization: `Bearer ${activeToken}`,
      },
    };
  }, [activeToken, fileUrl]);
}
