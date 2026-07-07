import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { DatabaseProvider } from "@/hooks/useDatabase";
import { CustomersPage } from "@/pages/CustomersPage";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";

/**
 * Application shell.
 *
 * Hierarchy:
 * - DatabaseProvider: ensures SQLite migrations run before any route renders
 * - BrowserRouter + Routes: client-side routing
 * - Toaster: global sonner toast container
 */
function DatabaseGate({ children }: { children: React.ReactNode }) {
  return <DatabaseProvider>{children}</DatabaseProvider>;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <DatabaseGate>
      <AppRouter />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </DatabaseGate>
  );
}
