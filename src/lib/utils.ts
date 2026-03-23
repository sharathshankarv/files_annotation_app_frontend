import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with support for conditional logic and conflict resolution.
 * This is a "Defensive" utility that prevents CSS specificity issues.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
