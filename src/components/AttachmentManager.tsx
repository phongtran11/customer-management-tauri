import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  ImagePlus,
  Trash2,
  Image as ImageIcon,
  Eye,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachments,
  type AttachmentWithUrl,
} from "@/hooks/useAttachments";
import { formatDateTime, getFileName } from "@/lib/utils";

// =============================================================================
// Sub-components
// =============================================================================

interface AttachmentCardProps {
  attachment: AttachmentWithUrl;
  onDelete: (id: number, filePath: string) => void;
  isDeleting: boolean;
  onView: (attachment: AttachmentWithUrl) => void;
}

/**
 * Một ô hiển thị ảnh đính kèm thu nhỏ (thumbnail).
 * Hiển thị lớp phủ biểu tượng Mắt khi di chuột để xem, và nút Xóa.
 */
function AttachmentCard({
  attachment,
  onDelete,
  isDeleting,
  onView,
}: AttachmentCardProps) {
  const fileName = getFileName(attachment.file_path);

  return (
    <div
      className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md cursor-pointer shrink-0"
      aria-label={`Tệp đính kèm: ${fileName}`}
      onClick={() => onView(attachment)}
    >
      {/* Ảnh thu nhỏ */}
      <div className="h-full w-full overflow-hidden bg-muted flex items-center justify-center">
        <img
          src={attachment.assetUrl}
          alt={fileName}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const placeholder = target.nextElementSibling as HTMLElement | null;
            if (placeholder) placeholder.style.display = "flex";
          }}
        />
        {/* Trình hiển thị dự phòng nếu lỗi tải ảnh */}
        <div className="hidden h-full w-full items-center justify-center">
          <ImageIcon
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Lớp phủ xem ảnh */}
      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
        <Eye className="h-5 w-5 text-white" aria-hidden="true" />
      </div>

      {/* Nút Xóa tệp (dừng nổi bọt sự kiện để không kích hoạt hộp thoại xem ảnh) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-1 top-1"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="rounded-md bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-destructive"
              disabled={isDeleting}
              aria-label={`Xóa tệp đính kèm ${fileName}`}
              id={`delete-attachment-${attachment.id}`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa Tệp Đính Kèm</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa tệp đính kèm{" "}
                <strong>{fileName}</strong>? Thao tác này sẽ xóa vĩnh viễn tệp
                tin khỏi ổ đĩa và không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(attachment.id, attachment.file_path)}
                id={`confirm-delete-attachment-${attachment.id}`}
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// =============================================================================
// Upload Modal Component
// =============================================================================

interface UploadModalProps {
  customerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewFile extends File {
  preview: string;
}

function UploadModal({ customerId, open, onOpenChange }: UploadModalProps) {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const uploadMutation = useUploadAttachments(customerId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      ) as PreviewFile[];
      setFiles((prev) => [...prev, ...newFiles]);
    },
  });

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const pastedFiles: PreviewFile[] = [];
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        hasImage = true;
        const file = item.getAsFile();
        if (file) {
          const previewFile = Object.assign(file, {
            preview: URL.createObjectURL(file),
          }) as PreviewFile;
          pastedFiles.push(previewFile);
        }
      }
    }

    if (hasImage) {
      e.preventDefault();
      setFiles((prev) => [...prev, ...pastedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
      setFiles([]);
    }
    onOpenChange(isOpen);
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    uploadMutation.mutate(files, {
      onSuccess: () => {
        handleOpenChange(false);
      },
    });
  };

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-xl bg-background border border-border shadow-2xl p-6 rounded-xl focus:outline-none"
        onPaste={handlePaste}
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-bold text-foreground">
            Tải lên tài liệu đính kèm
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kéo thả ảnh, nhấp để chọn tệp hoặc dán trực tiếp (Ctrl+V/Cmd+V) từ
            bộ nhớ tạm.
          </DialogDescription>
        </DialogHeader>

        {/* Dropzone Area */}
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10"
          }`}
          tabIndex={0}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground text-center">
            {isDragActive
              ? "Thả các tệp tin vào đây..."
              : "Kéo & thả ảnh vào đây, hoặc click để chọn ảnh"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Hỗ trợ Ctrl+V / Cmd+V để dán trực tiếp hình ảnh
          </p>
        </div>

        {/* Preview Area */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                Danh sách hàng đợi ({files.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  files.forEach((file) => URL.revokeObjectURL(file.preview));
                  setFiles([]);
                }}
                className="text-xs text-destructive hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 border border-border/50 rounded-lg bg-muted/5">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="group relative h-20 w-full overflow-hidden rounded-md border border-border bg-muted flex items-center justify-center"
                >
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="rounded-full bg-destructive p-1.5 text-white hover:bg-destructive/90 transition-colors"
                      aria-label="Xóa ảnh khỏi danh sách chờ"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[8px] text-white truncate text-center">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex items-center justify-end gap-2 mt-6 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={files.length === 0 || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              `Lưu ${files.length} ảnh`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface AttachmentManagerProps {
  customerId: number;
}

/**
 * Trình quản lý hình ảnh đính kèm của khách hàng.
 */
export function AttachmentManager({ customerId }: AttachmentManagerProps) {
  const { data: attachments, isLoading, isError } = useAttachments(customerId);
  const deleteMutation = useDeleteAttachment(customerId);
  const [viewingAttachment, setViewingAttachment] =
    useState<AttachmentWithUrl | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleAdd = () => {
    setIsUploadOpen(true);
  };

  const handleDelete = (id: number, filePath: string) => {
    deleteMutation.mutate({ id, filePath });
  };

  return (
    <section aria-label="Attachments" className="space-y-4">
      {/* Tiêu đề & Nút Thêm */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Tệp Đính Kèm
          {attachments && attachments.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {attachments.length}
            </span>
          )}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          id="add-attachment-button"
          aria-label="Thêm tệp đính kèm ảnh"
        >
          <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Thêm Ảnh
        </Button>
      </div>

      {/* Vùng cuộn chứa tệp tin đính kèm */}
      <div className="rounded-lg border border-border bg-muted/20">
        <ScrollArea className="h-44 w-full p-3">
          {/* Trạng thái tải danh sách */}
          {isLoading && (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          )}

          {/* Trạng thái lỗi */}
          {isError && (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Lỗi tải tệp đính kèm. Vui lòng thử lại.
            </p>
          )}

          {/* Trạng thái trống */}
          {!isLoading && !isError && attachments?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ImageIcon
                className="mb-2 h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground font-medium">
                Chưa có tệp đính kèm nào.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhấp vào nút &ldquo;Thêm Ảnh&rdquo; để đính kèm ảnh của khách
                hàng.
              </p>
            </div>
          )}

          {/* Thư viện ảnh thu nhỏ */}
          {!isLoading && attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <AttachmentCard
                  key={att.id}
                  attachment={att}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                  onView={setViewingAttachment}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Trình xem ảnh chi tiết (Lightbox Dialog) */}
      <Dialog
        open={!!viewingAttachment}
        onOpenChange={(open) => !open && setViewingAttachment(null)}
      >
        <DialogContent className="max-w-10/12 border-none bg-black/50 p-0 text-white shadow-2xl overflow-hidden sm:rounded-lg">
          <DialogHeader className="absolute top-4 left-4 z-10 text-left bg-black/60 p-2 rounded-md backdrop-blur-sm max-w-[calc(100%-3rem)] border border-white/10">
            <DialogTitle className="truncate text-xs font-semibold text-white">
              {viewingAttachment
                ? getFileName(viewingAttachment.file_path)
                : ""}
            </DialogTitle>
            {viewingAttachment && (
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Đã tải lên vào {formatDateTime(viewingAttachment.created_at)}
              </p>
            )}
          </DialogHeader>
          <div className="flex max-h-[75vh] min-h-[300px] w-full items-center justify-center p-6 mt-16 mb-6">
            {viewingAttachment && (
              <img
                src={viewingAttachment.assetUrl}
                alt={getFileName(viewingAttachment.file_path)}
                className="max-h-[65vh] max-w-full rounded-md object-contain shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Tải Lên Tệp Đính Kèm */}
      <UploadModal
        customerId={customerId}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </section>
  );
}
