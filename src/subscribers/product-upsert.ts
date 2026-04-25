import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"
import MeilisearchModuleService from "../modules/meilisearch/service"

export default async function productUpsertHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const meilisearch: MeilisearchModuleService = container.resolve(MEILISEARCH_MODULE)

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: event.data.id },
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "status",
      "tags.*",
      "categories.*",
      "variants.*",
      "brand.*",
    ],
  })

  if (products.length > 0) {
    await meilisearch.indexData(products as unknown as Record<string, unknown>[])
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
