import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteBrandStep, DeleteBrandStepInput } from "./steps/delete-brand"

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  (input: DeleteBrandStepInput) => {
    deleteBrandStep(input)

    return new WorkflowResponse(undefined)
  }
)
