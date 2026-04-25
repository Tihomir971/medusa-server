import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncProductsWorkflow } from "../workflows/sync-products"

export default async function meilisearchSyncHandler({
  container,
}: SubscriberArgs) {
  const logger = container.resolve("logger")

  let hasMore = true
  let offset = 0
  const limit = 50
  let total = 0

  logger.info("Meilisearch: starting full product sync...")

  while (hasMore) {
    const {
      result: { products, metadata },
    } = await syncProductsWorkflow(container).run({
      input: { limit, offset },
    })

    hasMore = offset + limit < (metadata?.count ?? 0)
    offset += limit
    total += (products as any[]).length
  }

  logger.info(`Meilisearch: indexed ${total} products`)
}

export const config: SubscriberConfig = {
  event: "meilisearch.sync",
}
