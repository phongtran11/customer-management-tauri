import { useState } from "react";
import { ImagePlus, Trash2, Image as ImageIcon, Eye } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAttachments,
  useAddAttachment,
  useDeleteAttachment,
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
 * A smaller, compact thumbnail representation of an attachment.
 * Shows an Eye icon overlay on hover to view, and a Delete button.
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
      aria-label={`Attachment: ${fileName}`}
      onClick={() => onView(attachment)}
    >
      {/* Image Thumbnail */}
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
        {/* Fallback placeholder */}
        <div className="hidden h-full w-full items-center justify-center">
          <ImageIcon
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Hover Viewer Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
        <Eye className="h-5 w-5 text-white" aria-hidden="true" />
      </div>

      {/* Delete Button (stopped propagation so it doesn't open the viewer dialog) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-1 top-1"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="rounded-md bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-destructive"
              disabled={isDeleting}
              aria-label={`Delete attachment ${fileName}`}
              id={`delete-attachment-${attachment.id}`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{fileName}</strong>?
                This will permanently remove the file from disk and cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(attachment.id, attachment.file_path)}
                id={`confirm-delete-attachment-${attachment.id}`}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface AttachmentManagerProps {
  customerId: number;
}

/**
 * Displays and manages image attachments for a customer.
 *
 * - Shows a scrollable gallery of smaller image thumbnails (fixed height container).
 * - Clicking a thumbnail opens the full-screen image viewer.
 * - "Add Image" opens the OS native file picker.
 * - Each image can be deleted.
 */
export function AttachmentManager({ customerId }: AttachmentManagerProps) {
  const { data: attachments, isLoading, isError } = useAttachments(customerId);
  const addMutation = useAddAttachment(customerId);
  const deleteMutation = useDeleteAttachment(customerId);
  const [viewingAttachment, setViewingAttachment] =
    useState<AttachmentWithUrl | null>(null);

  const handleAdd = () => {
    addMutation.mutate();
  };

  const handleDelete = (id: number, filePath: string) => {
    deleteMutation.mutate({ id, filePath });
  };

  return (
    <section aria-label="Attachments" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Attachments
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
          disabled={addMutation.isPending}
          id="add-attachment-button"
          aria-label="Add image attachment"
        >
          <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add Image
        </Button>
      </div>

      {/* Scrollable Container with Fixed Height */}
      <div className="rounded-lg border border-border bg-muted/20">
        <ScrollArea className="h-44 w-full p-3">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load attachments. Please try again.
            </p>
          )}

          {/* Empty State */}
          {!isLoading && !isError && attachments?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ImageIcon
                className="mb-2 h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground font-medium">
                No attachments yet.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click &ldquo;Add Image&rdquo; to attach a photo.
              </p>
            </div>
          )}

          {/* Compact Gallery Grid */}
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

      {/* Image Viewer Lightbox Dialog */}
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
                Uploaded {formatDateTime(viewingAttachment.created_at)}
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
    </section>
  );
}
