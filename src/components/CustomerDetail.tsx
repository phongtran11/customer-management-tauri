import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { formatDate } from "@/lib/utils";
import type { Customer } from "@/types";

// =============================================================================
// Zod Schema
// =============================================================================

const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
    .max(100, "Họ và tên tối đa 100 ký tự.")
    .trim(),
  phone: z
    .string()
    .min(7, "Số điện thoại phải có ít nhất 7 chữ số.")
    .max(20, "Số điện thoại quá dài.")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      "Vui lòng nhập số điện thoại hợp lệ."
    )
    .trim(),
});

type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface CustomerDetailProps {
  customer: Customer;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Hiển thị chi tiết đầy đủ của một khách hàng.
 */
export function CustomerDetail({ customer }: CustomerDetailProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const form = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone,
    },
  });

  // Giữ form đồng bộ nếu thuộc tính customer thay đổi
  const resetToCustomer = () => {
    form.reset({ name: customer.name, phone: customer.phone });
  };

  const handleEdit = () => {
    resetToCustomer();
    setIsEditing(true);
  };

  const handleCancel = () => {
    resetToCustomer();
    setIsEditing(false);
  };

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ id: customer.id, ...values });
      setIsEditing(false);
    } catch {
      // Lỗi được xử lý bởi hook mutation
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(customer.id);
      navigate("/");
    } catch {
      // Lỗi được xử lý bởi hook mutation
    }
  };

  const initials = customer.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6">
      {/* Thanh điều hướng ở trên */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          id="back-to-list"
          aria-label="Quay lại danh sách khách hàng"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">
            {customer.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Khách hàng từ {formatDate(customer.created_at)}
          </p>
        </div>

        {/* Các nút hành động */}
        {!isEditing ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              id="edit-customer-button"
              aria-label="Sửa thông tin khách hàng"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Sửa
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  id="delete-customer-button"
                  aria-label="Xóa khách hàng"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa Khách Hàng</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng{" "}
                    <strong>{customer.name}</strong>? Tất cả các tệp đính kèm
                    liên quan cũng sẽ bị xóa khỏi cơ sở dữ liệu và thiết bị.
                    Thao tác này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                    id="confirm-delete-customer"
                  >
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              id="save-customer-button"
              aria-label="Lưu thay đổi"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
              Lưu
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              id="cancel-edit-button"
              aria-label="Hủy sửa"
            >
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Hủy
            </Button>
          </div>
        )}
      </div>

      {/* Phần Hồ Sơ Khách Hàng */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Ảnh Đại Diện */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* Dữ liệu hoặc Form chỉnh sửa */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Form {...form}>
                <form className="space-y-4" id="update-customer-form" aria-label="Biểu mẫu chỉnh sửa thông tin khách hàng">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" aria-hidden="true" />
                          Họ và Tên
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="edit-customer-name"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          Số Điện Thoại
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="edit-customer-phone"
                            type="tel"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : (
              <dl className="space-y-3">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    Họ và Tên
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{customer.name}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    Số Điện Thoại
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Mã Khách Hàng</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary" className="font-mono text-xs">
                      #{customer.id}
                    </Badge>
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Phần Đính Kèm - Quản lý tệp đính kèm được ủy quyền hoàn toàn cho AttachmentManager. */}
      {/* AttachmentManager hiện đã hỗ trợ chọn và tải lên cùng lúc nhiều tệp đính kèm. */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <AttachmentManager customerId={customer.id} />
      </div>
    </div>
  );
}
