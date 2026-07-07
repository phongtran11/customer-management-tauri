import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerDetail } from "@/components/CustomerDetail";
import { useCustomer } from "@/hooks/useCustomers";

/**
 * Customer detail page.
 *
 * Reads the `:id` route parameter, fetches the customer, and renders
 * the <CustomerDetail> component when data is available.
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

  // Invalid route param
  if (!isValidId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-destructive">Invalid customer ID.</p>
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          id="back-from-invalid"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* App Sub-header Bar */}
      <header
        className="flex shrink-0 items-center border-b border-border bg-card/80 px-6 py-3 backdrop-blur-sm"
        data-tauri-drag-region
      >
        <span className="text-sm font-semibold text-foreground">
          Customer Management
        </span>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6" aria-busy="true" aria-label="Loading customer details">
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

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error instanceof Error
                ? error.message
                : "Failed to load customer details."}
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              id="back-from-error"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to List
            </Button>
          </div>
        )}

        {/* Not Found */}
        {!isLoading && !isError && !customer && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Customer not found.</p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              id="back-from-not-found"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to List
            </Button>
          </div>
        )}

        {/* Detail View */}
        {!isLoading && !isError && customer && (
          <CustomerDetail customer={customer} />
        )}
      </main>
    </div>
  );
}
