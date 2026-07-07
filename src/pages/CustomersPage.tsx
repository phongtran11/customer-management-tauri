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
 * Main customers list page.
 *
 * Layout:
 * - Fixed header with app title and "+ New Customer" sheet trigger
 * - Scrollable customer list below
 */
export function CustomersPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* App Header */}
      <header
        className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm"
        data-tauri-drag-region
      >
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Customer Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your customer records
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" id="new-customer-button" aria-label="Create new customer">
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Customer
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add New Customer</SheetTitle>
              <SheetDescription>
                Fill in the details below to create a new customer record.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <CustomerForm onSuccess={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col overflow-hidden px-6 py-4">
        <CustomerList />
      </main>
    </div>
  );
}
