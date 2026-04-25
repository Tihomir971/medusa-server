import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MEILISEARCH_MODULE } from "../../modules/meilisearch"
import MeilisearchModuleService from "../../modules/meilisearch/service"

export type IndexProductsStepInput = {
  products: Record<string, unknown>[]
}

export const indexProductsStep = createStep(
  "index-products-step",
  async ({ products }: IndexProductsStepInput, { container }) => {
    const meilisearch: MeilisearchModuleService = container.resolve(MEILISEARCH_MODULE)
    await meilisearch.indexData(products)
    return new StepResponse(
      products,
      products.map((p) => p.id as string)
    )
  },
  async (productIds: string[], { container }) => {
    const meilisearch: MeilisearchModuleService = container.resolve(MEILISEARCH_MODULE)
    await meilisearch.deleteFromIndex(productIds)
  }
)
