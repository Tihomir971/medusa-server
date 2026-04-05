import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"

export type UpdateBrandStepInput = {
  id: string
  name: string
}

export const updateBrandStep = createStep(
  "update-brand-step",
  async (input: UpdateBrandStepInput, { container }) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE)

    const existing = await brandModuleService.retrieveBrand(input.id)

    const brand = await brandModuleService.updateBrands(input)

    return new StepResponse(brand, { id: existing.id, name: existing.name })
  },
  async (
    previousData: { id: string; name: string },
    { container }
  ) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE)

    await brandModuleService.updateBrands(previousData)
  }
)
