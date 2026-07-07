// =============================================================================
// Domain Models — strict interfaces matching the SQLite schema
// =============================================================================

/** A customer record as returned from the `customers` table. */
export interface Customer {
  id: number;
  name: string;
  phone: string;
  created_at: string;
}

/** An attachment record as returned from the `attachments` table. */
export interface Attachment {
  id: number;
  customer_id: number;
  file_path: string;
  created_at: string;
}

// =============================================================================
// Form Payloads — validated with Zod in forms
// =============================================================================

/** Payload for creating a new customer. */
export interface CreateCustomerPayload {
  name: string;
  phone: string;
}

/** Payload for updating an existing customer's editable fields. */
export interface UpdateCustomerPayload {
  id: number;
  name: string;
  phone: string;
}

// =============================================================================
// API Result Wrappers — returned by Tauri SQL plugin
// =============================================================================

/** Returned by `db.execute()` for INSERT / UPDATE / DELETE operations. */
export interface SqlExecuteResult {
  lastInsertId: number;
  rowsAffected: number;
}

// =============================================================================
// Attachment Operations
// =============================================================================

/** Payload for creating a new attachment record. */
export interface CreateAttachmentPayload {
  customer_id: number;
  file_path: string;
}
