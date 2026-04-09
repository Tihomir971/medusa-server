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

  // query.graph supports filtering by direct model relations (categories is a
  // direct ManyToMany on Product, not a module link — so filtering works here)
  const filters: Record<string, unknown> = {}
  if (categoryIds?.length) {
    filters.categories = { id: categoryIds }
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "brand.id", "brand.name"],
    filters,
  })

  const brandMap = new Map<string, { id: string; name: string }>()
  for (const product of products) {
    const brand = (product as any).brand
    if (brand?.id) brandMap.set(brand.id, { id: brand.id, name: brand.name })
  }

  const brands = Array.from(brandMap.values())
  res.json({ brands, count: brands.length })
}
