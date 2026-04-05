import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateBrandStep, UpdateBrandStepInput } from "./steps/update-brand"

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  (input: UpdateBrandStepInput) => {
    const brand = updateBrandStep(input)

    return new WorkflowResponse(brand)
  }
)
