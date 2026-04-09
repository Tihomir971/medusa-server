import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const { brand_id, category_id } = req.query as {
    brand_id?: string | string[]
    category_id?: string | string[]
  }

  const filters: Record<string, unknown> = {}

  if (category_id) {
    filters.product_categories = {
      id: Array.isArray(category_id) ? category_id : [category_id],
    }
  }

  if (brand_id) {
    filters.brand = {
      id: Array.isArray(brand_id) ? brand_id : [brand_id],
    }
  }

  const { data: products, metadata } = await query.index({
    entity: "product",
    ...req.queryConfig,
    filters,
  })

  res.json({
    products,
    count: metadata?.count,
    limit: metadata?.take,
    offset: metadata?.skip,
  })
}
