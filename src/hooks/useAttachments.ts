import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile, mkdir, remove, exists } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { getDb } from "@/lib/db";
import { getFileName } from "@/lib/utils";
import type { Attachment, SqlExecuteResult } from "@/types";

// =============================================================================
// Query Keys
// =============================================================================

export const ATTACHMENT_QUERY_KEYS = {
  forCustomer: (customerId: number) => ["attachments", customerId] as const,
} as const;

// =============================================================================
// Data Access Functions
// =============================================================================

async function fetchAttachmentsByCustomer(
  customerId: number,
): Promise<Attachment[]> {
  const db = await getDb();
  return db.select<Attachment[]>(
    "SELECT id, customer_id, file_path, created_at FROM attachments WHERE customer_id = $1 ORDER BY created_at DESC",
    [customerId],
  );
}

async function insertAttachment(
  customerId: number,
  filePath: string,
): Promise<SqlExecuteResult> {
  const db = await getDb();
  return db.execute(
    "INSERT INTO attachments (customer_id, file_path) VALUES ($1, $2)",
    [customerId, filePath],
  ) as Promise<SqlExecuteResult>;
}

async function deleteAttachmentRecord(id: number): Promise<SqlExecuteResult> {
  const db = await getDb();
  return db.execute("DELETE FROM attachments WHERE id = $1", [
    id,
  ]) as Promise<SqlExecuteResult>;
}

// =============================================================================
// File System Helpers
// =============================================================================

/**
 * Returns the absolute path to the attachments subdirectory inside appDataDir.
 * Creates the directory if it does not yet exist.
 */
async function ensureAttachmentsDir(): Promise<string> {
  const dataDir = await appDataDir();
  const attachmentsDir = await join(dataDir, "attachments");

  const dirExists = await exists(attachmentsDir);
  if (!dirExists) {
    await mkdir(attachmentsDir, { recursive: true });
  }

  return attachmentsDir;
}

/**
 * Copies a source file into the attachments directory with a unique filename
 * to avoid collisions (prepends a timestamp).
 *
 * @returns The destination path inside appDataDir.
 */
async function copyFileToAppData(sourcePath: string): Promise<string> {
  const attachmentsDir = await ensureAttachmentsDir();
  const originalName = getFileName(sourcePath);
  const timestamp = Date.now();
  const destFileName = `${timestamp}_${originalName}`;
  const destPath = await join(attachmentsDir, destFileName);

  await copyFile(sourcePath, destPath);
  return destPath;
}

// =============================================================================
// React Query Hooks
// =============================================================================

/**
 * Fetches all attachments for a given customer.
 * Converts file paths to asset URLs for rendering in <img> tags.
 */
export function useAttachments(customerId: number) {
  return useQuery({
    queryKey: ATTACHMENT_QUERY_KEYS.forCustomer(customerId),
    queryFn: () => fetchAttachmentsByCustomer(customerId),
    enabled: customerId > 0,
    staleTime: 1000 * 30,
    select: (data) =>
      data.map((att) => ({
        ...att,
        assetUrl: convertFileSrc(att.file_path),
      })),
  });
}

/** An attachment with a resolved asset URL for displaying images. */
export type AttachmentWithUrl = Attachment & { assetUrl: string };

/**
 * Mutation: opens the OS image picker, copies the selected file into appDataDir,
 * and stores the local path in the database.
 */
export function useAddAttachment(customerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      successCount: number;
      errors: string[];
    } | null> => {
      // 1. Open native file picker (images only)
      // `open` with `multiple: true` returns `string[] | null` (or `string | string[] | null`)
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"],
          },
        ],
      });

      if (!selected) {
        // User cancelled — not an error
        return null;
      }

      const sourcePaths = Array.isArray(selected) ? selected : [selected];
      const errors: string[] = [];
      let successCount = 0;

      // 2. Copy the files and insert records sequentially to handle partial failures
      for (const sourcePath of sourcePaths) {
        try {
          const destPath = await copyFileToAppData(sourcePath);
          await insertAttachment(customerId, destPath);
          successCount++;
        } catch (err) {
          console.error(
            `[useAddAttachment] Failed to process ${sourcePath}:`,
            err,
          );
          errors.push(getFileName(sourcePath));
        }
      }

      return { successCount, errors };
    },
    onSuccess: (data) => {
      if (!data) {
        // User cancelled dialog
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ATTACHMENT_QUERY_KEYS.forCustomer(customerId),
      });

      const { successCount, errors } = data;
      if (successCount > 0 && errors.length === 0) {
        toast.success(`Đã thêm ${successCount} tệp đính kèm thành công.`);
      } else if (successCount > 0 && errors.length > 0) {
        toast.warning(
          `Đã thêm thành công ${successCount} tệp. Thất bại ${errors.length} tệp: ${errors.join(", ")}`,
        );
      } else if (errors.length > 0) {
        toast.error(
          `Không thể thêm tệp đính kèm nào. Thất bại: ${errors.join(", ")}`,
        );
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Không thể đính kèm tệp tin";
      toast.error(message);
      console.error("[useAddAttachment]", err);
    },
  });
}

/**
 * Mutation: deletes an attachment record from the DB and removes the file from disk.
 */
export function useDeleteAttachment(customerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      filePath,
    }: {
      id: number;
      filePath: string;
    }): Promise<void> => {
      // 1. Remove the DB record first
      await deleteAttachmentRecord(id);

      // 2. Remove the file from disk (best-effort — don't fail if already gone)
      try {
        const fileExists = await exists(filePath);
        if (fileExists) {
          await remove(filePath);
        }
      } catch (fsErr) {
        console.warn("[useDeleteAttachment] Could not remove file:", fsErr);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ATTACHMENT_QUERY_KEYS.forCustomer(customerId),
      });
      toast.success("Đã xóa tệp đính kèm thành công.");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Không thể xóa tệp đính kèm";
      toast.error(message);
      console.error("[useDeleteAttachment]", err);
    },
  });
}
