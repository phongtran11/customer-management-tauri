import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerDetail } from "@/components/CustomerDetail";
import { useCustomer } from "@/hooks/useCustomers";

/**
 * Trang chi tiết khách hàng.
 */
export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customerId = parseInt(id ?? "0", 10);
  const isValidId = !isNaN(customerId) && customerId > 0;

  const {
    data: customer,
    isLoading,
    isError,
    error,
  } = useCustomer(isValidId ? customerId : 0);

  // ID không hợp lệ
  if (!isValidId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-destructive">Mã ID khách hàng không hợp lệ.</p>
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          id="back-from-invalid"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Thanh công cụ phụ */}
      <header
        className="flex shrink-0 items-center border-b border-border bg-card/80 px-6 py-3 backdrop-blur-sm"
        data-tauri-drag-region
      >
        <span className="text-sm font-semibold text-foreground">
          Quản Lý Khách Hàng
        </span>
      </header>

      {/* Nội dung chi tiết */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {/* Trạng thái tải dữ liệu */}
        {isLoading && (
          <div className="space-y-6" aria-busy="true" aria-label="Đang tải chi tiết khách hàng">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
        )}

        {/* Trạng thái lỗi */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error instanceof Error
                ? error.message
                : "Không thể tải thông tin chi tiết khách hàng."}
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              id="back-from-error"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Quay lại danh sách
            </Button>
          </div>
        )}

        {/* Không tìm thấy bản ghi */}
        {!isLoading && !isError && !customer && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Không tìm thấy thông tin khách hàng.</p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              id="back-from-not-found"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Quay lại danh sách
            </Button>
          </div>
        )}

        {/* Hiển thị chi tiết */}
        {!isLoading && !isError && customer && (
          <CustomerDetail customer={customer} />
        )}
      </main>
    </div>
  );
}
