import { AxiosError } from "axios";

/** * Base shape of every error returned by our NestJS backend
 * (Matches the standard NestJS HttpException shape)
 */
export interface BaseApiError {
  statusCode: number;
  message: string | string[]; // Nest often sends an array for validation errors
  error?: string; // e.g., "Unauthorized" or "Bad Request"
}

/** * Extended error for specialized cases, like File Uploads
 */
export interface FileUploadError extends BaseApiError {
  fileId?: string;
  maxSizeAllowed?: number;
}

/** * The Union Type for the entire app
 */
export type AppError = BaseApiError | FileUploadError;
export type ApiAxiosError = AxiosError<BaseApiError>;
