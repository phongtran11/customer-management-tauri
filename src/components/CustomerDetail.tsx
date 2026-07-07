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
 * Full detail view for a customer.
 *
 * Features:
 * - Inline edit mode for name and phone (toggled by the Edit button)
 * - Save / Cancel with full Zod validation
 * - Destructive delete with confirmation dialog
 * - Embedded AttachmentManager
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

  // Keep form in sync if the customer prop changes (e.g. after invalidation)
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
      // Error toast handled in mutation hook
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(customer.id);
      navigate("/");
    } catch {
      // Error toast handled in mutation hook
    }
  };

  const initials = customer.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          id="back-to-list"
          aria-label="Back to customer list"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">
            {customer.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Customer since {formatDate(customer.created_at)}
          </p>
        </div>

        {/* Action Buttons */}
        {!isEditing ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              id="edit-customer-button"
              aria-label="Edit customer"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  id="delete-customer-button"
                  aria-label="Delete customer"
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
                  <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete{" "}
                    <strong>{customer.name}</strong>? All associated
                    attachments will also be removed from the database. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                    id="confirm-delete-customer"
                  >
                    Delete
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
              aria-label="Save changes"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              id="cancel-edit-button"
              aria-label="Cancel editing"
            >
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* Info or Edit Form */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Form {...form}>
                <form className="space-y-4" id="update-customer-form" aria-label="Edit customer form">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" aria-hidden="true" />
                          Full Name
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
                          Phone Number
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
                    Full Name
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{customer.name}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    Phone Number
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Customer ID</dt>
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

      {/* Attachments */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <AttachmentManager customerId={customer.id} />
      </div>
    </div>
  );
}
