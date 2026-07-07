import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CustomerList } from "@/components/CustomerList";
import { CustomerForm } from "@/components/CustomerForm";

/**
 * Trang danh sách khách hàng chính.
 */
export function CustomersPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Tiêu đề ứng dụng */}
      <header
        className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm"
        data-tauri-drag-region
      >
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản Lý Khách Hàng
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản lý hồ sơ thông tin khách hàng
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" id="new-customer-button" aria-label="Thêm khách hàng mới">
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Thêm Khách Hàng
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Thêm Khách Hàng Mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết dưới đây để tạo hồ sơ khách hàng mới.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <CustomerForm onSuccess={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Nội dung danh sách */}
      <main className="flex flex-1 flex-col overflow-hidden px-6 py-4">
        <CustomerList />
      </main>
    </div>
  );
}
