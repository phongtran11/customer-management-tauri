import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { runMigrations } from "@/lib/db";

// =============================================================================
// Context shape
// =============================================================================

interface DatabaseContextValue {
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

// =============================================================================
// Provider component
// =============================================================================

interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Wraps the application and ensures SQLite migrations have run before
 * any child component tries to query the database.
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        setIsReady(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize database";
        setError(message);
        console.error("[DatabaseProvider] Migration error:", err);
      }
    })();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

// =============================================================================
// Consumer hook
// =============================================================================

/**
 * Returns the database readiness state.
 * Throws if used outside of <DatabaseProvider>.
 */
export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error("useDatabase must be used within a <DatabaseProvider>");
  }
  return ctx;
}
