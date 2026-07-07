import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getDb } from "@/lib/db";
import type {
  CreateCustomerPayload,
  Customer,
  SqlExecuteResult,
  UpdateCustomerPayload,
} from "@/types";

// =============================================================================
// Query Keys
// =============================================================================

export const CUSTOMER_QUERY_KEYS = {
  all: ["customers"] as const,
  detail: (id: number) => ["customers", id] as const,
} as const;

// =============================================================================
// Data Access Functions
// =============================================================================

async function fetchAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  return db.select<Customer[]>(
    "SELECT id, name, phone, created_at FROM customers ORDER BY created_at DESC"
  );
}

async function fetchCustomerById(id: number): Promise<Customer | null> {
  const db = await getDb();
  const rows = await db.select<Customer[]>(
    "SELECT id, name, phone, created_at FROM customers WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

async function createCustomer(
  payload: CreateCustomerPayload
): Promise<SqlExecuteResult> {
  const db = await getDb();
  return db.execute(
    "INSERT INTO customers (name, phone) VALUES ($1, $2)",
    [payload.name, payload.phone]
  ) as Promise<SqlExecuteResult>;
}

async function updateCustomer(
  payload: UpdateCustomerPayload
): Promise<SqlExecuteResult> {
  const db = await getDb();
  return db.execute(
    "UPDATE customers SET name = $1, phone = $2 WHERE id = $3",
    [payload.name, payload.phone, payload.id]
  ) as Promise<SqlExecuteResult>;
}

async function deleteCustomer(id: number): Promise<SqlExecuteResult> {
  const db = await getDb();
  return db.execute(
    "DELETE FROM customers WHERE id = $1",
    [id]
  ) as Promise<SqlExecuteResult>;
}

// =============================================================================
// React Query Hooks
// =============================================================================

/**
 * Fetches the full list of customers.
 */
export function useCustomers() {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.all,
    queryFn: fetchAllCustomers,
    staleTime: 1000 * 30, // 30 seconds
  });
}

interface FetchInfiniteCustomersParams {
  searchQuery: string;
  limit: number;
  offset: number;
}

async function fetchInfiniteCustomers({ searchQuery, limit, offset }: FetchInfiniteCustomersParams): Promise<Customer[]> {
  const db = await getDb();
  if (searchQuery.trim()) {
    const likePattern = `%${searchQuery.trim()}%`;
    return db.select<Customer[]>(
      "SELECT id, name, phone, created_at FROM customers WHERE name LIKE $1 OR phone LIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [likePattern, limit, offset]
    );
  }
  return db.select<Customer[]>(
    "SELECT id, name, phone, created_at FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
}

/**
 * Fetches a paginated list of customers supporting search and infinite load-more.
 */
export function useInfiniteCustomers(searchQuery = "", limit = 15) {
  return useInfiniteQuery({
    queryKey: [...CUSTOMER_QUERY_KEYS.all, "infinite", searchQuery, limit] as const,
    queryFn: ({ pageParam = 0 }) =>
      fetchInfiniteCustomers({ searchQuery, limit, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) {
        return undefined;
      }
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    staleTime: 1000 * 10,
  });
}

async function fetchCustomersCount(searchQuery: string): Promise<number> {
  const db = await getDb();
  if (searchQuery.trim()) {
    const likePattern = `%${searchQuery.trim()}%`;
    const rows = await db.select<Array<{ "COUNT(*)": number }>>(
      "SELECT COUNT(*) FROM customers WHERE name LIKE $1 OR phone LIKE $1",
      [likePattern]
    );
    return rows[0]?.["COUNT(*)"] ?? 0;
  }
  const rows = await db.select<Array<{ "COUNT(*)": number }>>("SELECT COUNT(*) FROM customers");
  return rows[0]?.["COUNT(*)"] ?? 0;
}

/**
 * Fetches the total number of customers matching the search query.
 */
export function useCustomersCount(searchQuery = "") {
  return useQuery({
    queryKey: [...CUSTOMER_QUERY_KEYS.all, "count", searchQuery] as const,
    queryFn: () => fetchCustomersCount(searchQuery),
    staleTime: 1000 * 10,
  });
}

/**
 * Fetches a single customer by ID.
 */
export function useCustomer(id: number) {
  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.detail(id),
    queryFn: () => fetchCustomerById(id),
    enabled: id > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Creates a new customer and invalidates the list cache.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.all });
      toast.success("Đã thêm khách hàng thành công.");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Không thể thêm khách hàng";
      toast.error(message);
      console.error("[useCreateCustomer]", err);
    },
  });
}

/**
 * Updates a customer's name and phone number.
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.all });
      void queryClient.invalidateQueries({
        queryKey: CUSTOMER_QUERY_KEYS.detail(variables.id),
      });
      toast.success("Đã cập nhật thông tin khách hàng thành công.");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Không thể cập nhật thông tin khách hàng";
      toast.error(message);
      console.error("[useUpdateCustomer]", err);
    },
  });
}

/**
 * Deletes a customer by ID (attachments cascade-deleted in DB).
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_QUERY_KEYS.all });
      toast.success("Đã xóa khách hàng thành công.");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Không thể xóa khách hàng";
      toast.error(message);
      console.error("[useDeleteCustomer]", err);
    },
  });
}
