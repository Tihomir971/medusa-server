import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const { category_id } = req.query as {
    category_id?: string | string[]
  }

  const categoryIds = category_id
    ? Array.isArray(category_id)
      ? category_id
      : [category_id]
    : undefined

  const filters: Record<string, unknown> = {
    products: { id: { $ne: null } },
  }

  if (categoryIds?.length) {
    filters.products = {
      product_categories: {
        id: categoryIds,
      },
    }
  }

  const { data: brands } = await query.index({
    entity: "brand",
    fields: ["id", "name"],
    filters,
  })

  res.json({ brands, count: brands.length })
}
