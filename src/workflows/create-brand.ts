import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createBrandStep, CreateBrandStepInput } from "./steps/create-brand"

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  (input: CreateBrandStepInput) => {
    const brand = createBrandStep(input)

    return new WorkflowResponse(brand)
  }
)
