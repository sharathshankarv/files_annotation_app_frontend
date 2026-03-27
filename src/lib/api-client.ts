import axios, { InternalAxiosRequestConfig } from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';
import { useAuthStore } from '@/store/useAuthStore';
import { APP_CONFIG, ROUTES, API_CONFIG, AUTH_CONFIG } from '@/utils/constants';
import { isTokenExpired } from './auth-util';

export const API_BASE_URL = API_CONFIG.BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.REQUEST_TIMEOUT_MS,
});

const handleUnauthorized = () => {
  useAuthStore.getState().logout();
  deleteCookie(APP_CONFIG.COOKIE_NAME);

  if (typeof window !== 'undefined') {
    window.location.href = `${ROUTES.LOGIN}?reason=${AUTH_CONFIG.LOGIN_EXPIRED_REASON}`;
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const cookieToken = getCookie(APP_CONFIG.COOKIE_NAME) as string | null;
    const storeToken = useAuthStore.getState().token;
    const activeToken = storeToken || cookieToken;

    if (activeToken && isTokenExpired(activeToken)) {
      useAuthStore.getState().logout();
      deleteCookie(APP_CONFIG.COOKIE_NAME);
      if (typeof window !== 'undefined') {
        handleUnauthorized();
      }
      return Promise.reject(new Error('Token expired'));
    }

    if (activeToken && config.headers) {
      config.headers.Authorization = `Bearer ${activeToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      deleteCookie(APP_CONFIG.COOKIE_NAME);

      if (typeof window !== 'undefined') {
        handleUnauthorized();
      }
    }

    if (status === 403) {
      console.error('Access denied: you do not have permission for this action.');
    }

    return Promise.reject(error);
  },
);
