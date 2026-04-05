import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BRAND_MODULE } from "../../modules/brand"
import BrandModuleService from "../../modules/brand/service"

export type DeleteBrandStepInput = {
  id: string
}

export const deleteBrandStep = createStep(
  "delete-brand-step",
  async (input: DeleteBrandStepInput, { container }) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE)

    const existing = await brandModuleService.retrieveBrand(input.id)

    await brandModuleService.deleteBrands(input.id)

    return new StepResponse(undefined, { id: existing.id, name: existing.name })
  },
  async (
    previousData: { id: string; name: string },
    { container }
  ) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE)

    await brandModuleService.createBrands(previousData)
  }
)
