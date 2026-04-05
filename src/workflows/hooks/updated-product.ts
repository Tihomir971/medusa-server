import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"
import productBrandLink from "../../links/product-brand"

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data || !("brand_id" in additional_data)) {
      return
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

    // Dismiss existing links
    if (existingLinks.length > 0) {
      await link.dismiss(
        existingLinks.map((l) => ({
          [Modules.PRODUCT]: { product_id: l.product_id },
          [BRAND_MODULE]: { brand_id: l.brand_id },
        }))
      )
    }

    const brandId = additional_data.brand_id as string | null | undefined

    if (!brandId) {
      logger.info("Unlinked brand from products")
      return
    }

    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE)

    // Throws if brand doesn't exist
    await brandModuleService.retrieveBrand(brandId)

    await link.create(
      productIds.map((productId) => ({
        [Modules.PRODUCT]: { product_id: productId },
        [BRAND_MODULE]: { brand_id: brandId },
      }))
    )

    logger.info("Linked brand to products")
  }
)
