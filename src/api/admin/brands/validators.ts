import { z } from "@medusajs/framework/zod"

export const PostAdminCreateBrand = z.object({
  name: z.string(),
})

export const PostAdminUpdateBrand = z.object({
  name: z.string(),
})
