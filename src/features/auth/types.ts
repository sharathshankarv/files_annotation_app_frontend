import { AxiosError } from "axios";
import { User } from "@/types"; // Assuming global User type

// The Unified Backend Error shape
export interface BaseApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// The missing 'ApiAxiosError'
export type ApiAxiosError = AxiosError<BaseApiError>;

// The missing 'LoginCredentials'
export interface LoginCredentials {
  email: string;
  password: string; // Match your NestJS property name
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
