import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const eventBus = req.scope.resolve("event_bus")
  await eventBus.emit({ name: "meilisearch.sync", data: {} })
  res.json({ message: "Meilisearch sync triggered" })
}
