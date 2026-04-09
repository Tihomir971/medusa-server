import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QueryContext } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const { brand_id, category_id, region_id } = req.query as {
    brand_id?: string | string[]
    category_id?: string | string[]
    region_id?: string
  }

  const filters: Record<string, unknown> = {}

  if (category_id) {
    filters.categories = {
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
    ...(region_id && {
      context: {
        variants: {
          calculated_price: QueryContext({ region_id }),
        },
      },
    }),
  })

  const { count, take, skip } = (metadata ?? {}) as {
    count?: number
    take?: number
    skip?: number
  }

  res.json({
    products,
    count,
    limit: take,
    offset: skip,
  })
}
