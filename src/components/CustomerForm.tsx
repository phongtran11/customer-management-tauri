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
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters.")
    .trim(),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 digits.")
    .max(20, "Phone number is too long.")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      "Please enter a valid phone number."
    )
    .trim(),
});

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface CustomerFormProps {
  /** Called when the customer is successfully created. */
  onSuccess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Form for creating a new customer.
 * Uses React Hook Form + Zod validation.
 * Submits via the useCreateCustomer mutation hook.
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
      // Error is handled inside the mutation hook (toast shown there)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        id="create-customer-form"
        aria-label="Create new customer form"
      >
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  id="customer-name"
                  placeholder="e.g. John Smith"
                  autoFocus
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Field */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  id="customer-phone"
                  placeholder="e.g. +1 (555) 000-1234"
                  type="tel"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          id="submit-create-customer"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Creating…
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Customer
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
