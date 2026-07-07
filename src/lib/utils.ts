import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely using clsx + tailwind-merge.
 * Used by all shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO datetime string to a locale-friendly display string.
 */
export function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Format an ISO datetime string to a locale-friendly display string with time.
 */
export function formatDateTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Extract filename from a full file path (cross-platform).
 */
export function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

/**
 * Check if a string is a supported image MIME extension.
 */
export function isImageFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
    ext ?? "",
  );
}

/**
 * Format count of uploaded files into a readable string in Vietnamese.
 */
export function formatFileCount(count: number): string {
  return `${count} tệp đính kèm`;
}

