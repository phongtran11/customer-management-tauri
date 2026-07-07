import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Search, User, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useInfiniteCustomers, useCustomersCount } from "@/hooks/useCustomers";
import { formatDate } from "@/lib/utils";
import type { Customer } from "@/types";

// =============================================================================
// Sub-components
// =============================================================================

interface CustomerRowProps {
  customer: Customer;
  onClick: (id: number) => void;
}

/**
 * A compact, collapsed row representing a customer.
 * Uses smaller padding and font sizes to fit more items on the screen.
 */
function CustomerRow({ customer, onClick }: CustomerRowProps) {
  const initials = customer.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <button
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      onClick={() => onClick(customer.id)}
      id={`customer-row-${customer.id}`}
      aria-label={`View details for ${customer.name}`}
    >
      {/* Avatar (Compact) */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary transition-colors group-hover:bg-primary/20"
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{customer.name}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
          {customer.phone}
        </p>
      </div>

      {/* Date */}
      <div className="shrink-0 text-right">
        <p className="text-xs text-muted-foreground">
          {formatDate(customer.created_at)}
        </p>
      </div>
    </button>
  );
}

function CustomerRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-2.5 w-14" />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Scrollable list of customers with database-level pagination,
 * explicit Search button submit flow, and compact/collapsed card layouts.
 */
export function CustomerList() {
  const navigate = useNavigate();
  
  // Local input value state
  const [searchInputValue, setSearchInputValue] = useState("");
  // Query state (only updated on form submit or clear)
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCustomers(searchQuery);

  const { data: totalCount = 0 } = useCustomersCount(searchQuery);

  const customers = data?.pages.flatMap((page) => page) ?? [];

  const handleRowClick = (id: number) => {
    navigate(`/customers/${id}`);
  };

  // Submit search query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
  };

  // Clear search and reset list
  const handleClearSearch = () => {
    setSearchInputValue("");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Search Bar Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full shrink-0">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="customer-search"
            type="search"
            placeholder="Search by name or phone…"
            className="pl-9 pr-8"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            aria-label="Search customers"
          />
          {searchInputValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <Button type="submit" id="search-submit-button">
          Search
        </Button>
      </form>

      {/* Customer Count */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 shrink-0">
          <span>
            Showing {customers.length} of {totalCount} customers
          </span>
          {customers.length === 0 && searchQuery && (
            <Badge variant="secondary">No results</Badge>
          )}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive shrink-0"
          role="alert"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load customers. Please restart the app."}
        </div>
      )}

      {/* List (contained ScrollArea) */}
      <ScrollArea className="flex-1 border border-border rounded-lg bg-card" aria-label="Customer list">
        <div className="space-y-1.5 p-3">
          {/* Loading State */}
          {isLoading &&
            [1, 2, 3, 4, 5, 6].map((i) => <CustomerRowSkeleton key={i} />)}

          {/* Empty State */}
          {!isLoading && !isError && customers.length === 0 && !searchQuery && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <User className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="font-medium text-foreground text-sm">No customers yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click &ldquo;+ New Customer&rdquo; to get started.
              </p>
            </div>
          )}

          {/* Search Empty State */}
          {!isLoading &&
            !isError &&
            searchQuery &&
            customers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium text-foreground text-sm">No results found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different name or phone number.
                </p>
              </div>
            )}

          {/* Customer Rows */}
          {customers.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              onClick={handleRowClick}
            />
          ))}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full sm:w-auto"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading more…
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
