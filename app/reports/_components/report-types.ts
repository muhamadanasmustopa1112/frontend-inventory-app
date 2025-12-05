// app/reports/_components/report-types.ts

export type PaginationMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

/* ================== SALES ================== */

export type SalesSummary = {
  total_revenue: string
  date_from: string | null
  date_to: string | null
  warehouse_id: number | null
  buyer_id: number | null
}

export type SalesBuyer = {
  id: number
  name: string
  phone: string
  address: string
  type: string | null
}

export type SalesWarehouse = {
  id: number
  name: string
  code: string
  city: string
  address: string
  is_active: boolean
}

export type SalesItemProduct = {
  id: number
  sku: string
  name: string
  default_sell_price: string
  category: string
  description: string
  is_active: number
}

export type SalesItem = {
  id: number
  stock_out_id: number
  product_id: number
  qty: number
  sell_price: string
  subtotal: string
  product: SalesItemProduct
}

export type SalesRow = {
  id: number
  warehouse_id: number
  buyer_id: number
  date_out: string
  total_price: string
  note: string | null
  created_by: number
  created_at: string
  updated_at: string
  warehouse: SalesWarehouse
  buyer: SalesBuyer
  items: SalesItem[]
}

/* ================== STOCK IN ================== */

export type StockInSummary = {
  total_transactions: number
  total_units_in_page: string
  date_from: string | null
  date_to: string | null
  warehouse_id: number | null
}

export type StockInWarehouse = SalesWarehouse

export type StockInItemProduct = SalesItemProduct

export type StockInItem = {
  id: number
  stock_in_id: number
  product_id: number
  qty: number
  sell_price: string
  buy_price: string
  product: StockInItemProduct
}

export type StockInRow = {
  id: number
  warehouse_id: number
  date_in: string
  reference: string
  note: string | null
  created_by: number
  created_at: string
  updated_at: string
  warehouse: StockInWarehouse
  items: StockInItem[]
}

/* ================== STOCK BALANCE ================== */

export type StockBalanceSummary = {
  total_rows: number
  total_qty: number
  warehouse_id: number | null
  product_id: number | null
  category: string | null
  search: string | null
}

export type StockBalanceRow = {
  product_id: number
  warehouse_id: number
  qty: number
  sku: string
  product_name: string
  category: string
  warehouse_name: string
  warehouse_city: string
}

/* ========== GENERIC LIST RESPONSE HELPER ========== */

export type ApiListResponse<T, S = any> = {
  summary?: S
  data: T[]
  meta?: PaginationMeta
  message?: string
}

export async function parseApiListResponse<T, S = any>(
  res: Response
): Promise<{
  ok: boolean
  rows: T[]
  meta: PaginationMeta | null
  summary: S | null
  message?: string
}> {
  const json = (await res.json().catch(() => null)) as ApiListResponse<T, S> | any

  if (!res.ok) {
    return {
      ok: false,
      rows: [],
      meta: null,
      summary: null,
      message: json?.message || "Request failed",
    }
  }

  if (!json) {
    return {
      ok: true,
      rows: [],
      meta: null,
      summary: null,
    }
  }

  return {
    ok: true,
    rows: (json.data as T[]) ?? [],
    meta: (json.meta as PaginationMeta) ?? null,
    summary: (json.summary as S) ?? null,
  }
}
