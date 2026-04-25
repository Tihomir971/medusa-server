import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MEILISEARCH_MODULE } from "../../../../modules/meilisearch"
import MeilisearchModuleService from "../../../../modules/meilisearch/service"

export const SearchSchema = z.object({
  query: z.string().min(1),
})

type SearchRequest = z.infer<typeof SearchSchema>

export async function POST(
  req: MedusaRequest<SearchRequest>,
  res: MedusaResponse
) {
  const meilisearch: MeilisearchModuleService = req.scope.resolve(MEILISEARCH_MODULE)
  const results = await meilisearch.search(req.validatedBody.query)
  res.json(results)
}
