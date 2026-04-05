import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateBrandWorkflow } from "../../../../workflows/update-brand"
import { deleteBrandWorkflow } from "../../../../workflows/delete-brand"

type PostAdminUpdateBrandType = {
  name: string
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const {
    data: [brand],
  } = await query.graph({
    entity: "brand",
    filters: { id: req.params.id },
    ...req.queryConfig,
  })

  res.json({ brand })
}

export const POST = async (
  req: MedusaRequest<PostAdminUpdateBrandType>,
  res: MedusaResponse
) => {
  const { result } = await updateBrandWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json({ brand: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await deleteBrandWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({
    id: req.params.id,
    object: "brand",
    deleted: true,
  })
}
