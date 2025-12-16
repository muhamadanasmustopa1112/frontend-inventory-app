import { NextRequest, NextResponse } from "next/server"

type SalesResponse = {
  summary?: {
    total_revenue?: string
  }
  data?: Array<{
    date_out: string
    total_price: string
  }>
}

type StockInResponse = {
  summary?: {
    total_units_in_page?: string
    total_transactions?: number
  }
}

type StockOutResponse = {
  summary?: {
    total_units_out_page?: string
    total_transactions?: number
  }
  data?: Array<{
    items?: Array<{
      qty: number
      product?: {
        id: number
        name: string
      }
    }>
  }>
}

type StockBalanceResponse = {
  summary?: {
    total_qty?: number
    total_rows?: number
  }
  data?: Array<{
    product_id: number
    product_name: string
    category: string
    warehouse_name: string
    qty: number
  }>
}

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || ""
    const base = new URL(req.url).origin

    const [salesRes, stockInRes, stockOutRes, stockBalanceRes] =
      await Promise.all([
        fetch(`${base}/api/reports/sales`, {
          headers: { cookie },
          cache: "no-store",
        }),
        fetch(`${base}/api/reports/stock-in`, {
          headers: { cookie },
          cache: "no-store",
        }),
        fetch(`${base}/api/reports/stock-out`, {
          headers: { cookie },
          cache: "no-store",
        }),
        fetch(`${base}/api/reports/stock-balance`, {
          headers: { cookie },
          cache: "no-store",
        }),
      ])

    const salesJson = (await salesRes.json().catch(() => null)) as SalesResponse
    const stockInJson = (await stockInRes.json().catch(() => null)) as StockInResponse
    const stockOutJson = (await stockOutRes.json().catch(() => null)) as StockOutResponse
    const stockBalanceJson = (await stockBalanceRes.json().catch(() => null)) as StockBalanceResponse

    // ---- Summary ----
    const totalRevenue = Number(salesJson?.summary?.total_revenue ?? 0)
    const totalUnitsIn = Number(stockInJson?.summary?.total_units_in_page ?? 0)
    const totalUnitsOut = Number(stockOutJson?.summary?.total_units_out_page ?? 0)
    const totalStockQty = Number(stockBalanceJson?.summary?.total_qty ?? 0)

    // ---- Revenue trend by date ----
    const revenueTrendMap: Record<string, number> = {}

    for (const row of salesJson?.data ?? []) {
      const d = row.date_out?.slice(0, 10)
      if (!d) continue
      const amount = Number(row.total_price ?? 0)
      revenueTrendMap[d] = (revenueTrendMap[d] || 0) + amount
    }

    const revenueTrend = Object.entries(revenueTrendMap)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, revenue]) => ({ date, revenue }))

    // ---- Stock by category ----
    const stockByCategoryMap: Record<string, number> = {}
    // ---- Stock by warehouse ----
    const stockByWarehouseMap: Record<string, number> = {}
    // ---- Top products ----
    const productQtyMap: Record<
      string,
      { product_id: number; product_name: string; qty: number }
    > = {}

    for (const row of stockBalanceJson?.data ?? []) {
      const cat = row.category || "Lainnya"
      stockByCategoryMap[cat] =
        (stockByCategoryMap[cat] || 0) + (row.qty ?? 0)

      const wh = row.warehouse_name || "Tanpa Warehouse"
      stockByWarehouseMap[wh] =
        (stockByWarehouseMap[wh] || 0) + (row.qty ?? 0)

      const key = `${row.product_id}`
      if (!productQtyMap[key]) {
        productQtyMap[key] = {
          product_id: row.product_id,
          product_name: row.product_name,
          qty: row.qty ?? 0,
        }
      } else {
        productQtyMap[key].qty += row.qty ?? 0
      }
    }

    const stockByProductMap: Record<string, number> = {}

    for (const row of stockBalanceJson?.data ?? []) {
      const productName = row.product_name || "Unknown Product"
      stockByProductMap[productName] =
        (stockByProductMap[productName] || 0) + (row.qty ?? 0)
    }

    const stockByProduct = Object.entries(stockByProductMap).map(
      ([product_name, qty]) => ({ product_name, qty })
    )

    const stockByWarehouse = Object.entries(stockByWarehouseMap).map(
      ([warehouse, qty]) => ({ warehouse, qty })
    )

    const topProducts = Object.values(productQtyMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    // ---- Stock out by product (FIXED) ----
    const stockOutByProductMap: Record<
      string,
      { product_name: string; qty: number }
    > = {}

    for (const trx of stockOutJson?.data ?? []) {
      for (const item of trx.items ?? []) {
        const productName = item.product?.name || "Unknown Product"
        const qty = Number(item.qty ?? 0)

        if (!stockOutByProductMap[productName]) {
          stockOutByProductMap[productName] = {
            product_name: productName,
            qty,
          }
        } else {
          stockOutByProductMap[productName].qty += qty
        }
      }
    }

    const stockOutByProduct = Object.values(stockOutByProductMap)

    const topStockOutProducts = [...stockOutByProduct]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return NextResponse.json(
      {
        summary: {
          totalRevenue,
          totalUnitsIn,
          totalUnitsOut,
          totalStockQty,
        },
        revenueTrend,
        stockByProduct,
        stockOutByProduct,
        stockByWarehouse,
        topProducts,
        topStockOutProducts,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error building dashboard:", error)
    return NextResponse.json(
      {
        message: "Failed to build dashboard data",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
