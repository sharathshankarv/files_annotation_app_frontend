import { useAppMutation } from '@/lib/mutation-factory';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import { LoginResponse, LoginCredentials } from '../types';
import { APP_CONFIG, AUTH_CONFIG } from '@/utils/constants';
import { setCookie } from 'cookies-next';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigator } from '@/hooks/use-navigator';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigator();

  return useAppMutation<LoginResponse, LoginCredentials>(
    API_ENDPOINTS.AUTH.LOGIN,
    'POST',
    {
      onSuccess: (data) => {
        setAuth(data.user, data.access_token);

        setCookie(APP_CONFIG.COOKIE_NAME, data.access_token, {
          maxAge: AUTH_CONFIG.COOKIE_MAX_AGE_SECONDS,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });

        setTimeout(() => {
          navigate.goToDashboard();
        }, AUTH_CONFIG.POST_LOGIN_REDIRECT_DELAY_MS);
      },
    },
  );
};
