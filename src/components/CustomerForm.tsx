import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateCustomer } from "@/hooks/useCustomers";

// =============================================================================
// Zod Validation Schema
// =============================================================================

const createCustomerSchema = z.object({
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

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface CustomerFormProps {
  /** Được gọi khi khách hàng được tạo thành công. */
  onSuccess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Biểu mẫu tạo mới thông tin khách hàng.
 */
export function CustomerForm({ onSuccess }: CustomerFormProps) {
  const { mutateAsync, isPending } = useCreateCustomer();

  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  async function onSubmit(values: CreateCustomerFormValues) {
    try {
      await mutateAsync(values);
      form.reset();
      onSuccess?.();
    } catch {
      // Lỗi được xử lý bởi hook mutation (đưa ra thông báo Toast)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        id="create-customer-form"
        aria-label="Biểu mẫu thêm khách hàng mới"
      >
        {/* Trường Họ và Tên */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và Tên</FormLabel>
              <FormControl>
                <Input
                  id="customer-name"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  autoFocus
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trường Số Điện Thoại */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số Điện Thoại</FormLabel>
              <FormControl>
                <Input
                  id="customer-phone"
                  placeholder="Ví dụ: 0901234567"
                  type="tel"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nút gửi dữ liệu */}
        <Button
          type="submit"
          id="submit-create-customer"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Đang tạo…
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Thêm Khách Hàng
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
