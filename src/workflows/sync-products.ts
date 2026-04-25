import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { indexProductsStep } from "./steps/index-products"

export type SyncProductsInput = {
  limit: number
  offset: number
}

export const syncProductsWorkflow = createWorkflow(
  "sync-products",
  (input: SyncProductsInput) => {
    const { data: products, metadata } = useQueryGraphStep({
      entity: "product",
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
      pagination: {
        take: input.limit,
        skip: input.offset,
      },
    })

    const indexed = indexProductsStep({ products: products as Record<string, unknown>[] })

    return new WorkflowResponse({ products: indexed, metadata })
  }
)
