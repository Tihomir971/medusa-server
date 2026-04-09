import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"
import productBrandLink from "../../links/product-brand"

type CompensationData = {
  oldLinks: LinkDefinition[]
  newLinks: LinkDefinition[]
}

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data || !("brand_id" in additional_data)) {
      return new StepResponse([], { oldLinks: [], newLinks: [] })
    }

    const link = container.resolve("link")
    const query = container.resolve("query")
    const logger = container.resolve("logger")

    const productIds = products.map((p) => p.id)

    // Fetch existing brand links for these products
    const { data: existingLinks } = await query.graph({
      entity: productBrandLink.entryPoint,
      fields: ["product_id", "brand_id"],
      filters: { product_id: productIds },
    })

    const oldLinks: LinkDefinition[] = existingLinks.map((l) => ({
      [Modules.PRODUCT]: { product_id: l.product_id },
      [BRAND_MODULE]: { brand_id: l.brand_id },
    }))

    // Dismiss existing links
    if (oldLinks.length > 0) {
      await link.dismiss(oldLinks)
    }

    const brandId = additional_data.brand_id as string | null | undefined

    if (!brandId) {
      logger.info("Unlinked brand from products")
      return new StepResponse([], { oldLinks, newLinks: [] })
    }

    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE)

    // Throws if brand doesn't exist
    await brandModuleService.retrieveBrand(brandId)

    const newLinks: LinkDefinition[] = productIds.map((productId) => ({
      [Modules.PRODUCT]: { product_id: productId },
      [BRAND_MODULE]: { brand_id: brandId },
    }))

    await link.create(newLinks)

    logger.info("Linked brand to products")

    return new StepResponse(newLinks, { oldLinks, newLinks })
  },
  async ({ oldLinks, newLinks }: CompensationData, { container }) => {
    if (!oldLinks && !newLinks) {
      return
    }

    const link = container.resolve("link")

    // Dismiss the newly created links
    if (newLinks?.length) {
      await link.dismiss(newLinks)
    }

    // Restore the old links
    if (oldLinks?.length) {
      await link.create(oldLinks)
    }
  }
)
