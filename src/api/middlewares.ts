import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "@medusajs/framework/zod"
import {
  PostAdminCreateBrand,
  PostAdminUpdateBrand,
} from "./admin/brands/validators"

export const GetBrandsSchema = createFindParams()
export const GetProductsByBrandSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // Validate brand_id in additional_data for product creation
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    // Validate brand_id in additional_data for product update
    {
      matcher: "/admin/products/:id",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().nullish(),
      },
    },
    // Brand list (admin)
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name", "products.*"],
          isList: true,
        }),
      ],
    },
    // Brand create
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateBrand)],
    },
    // Brand retrieve
    {
      matcher: "/admin/brands/:id",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name", "products.*"],
          isList: false,
        }),
      ],
    },
    // Brand update
    {
      matcher: "/admin/brands/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateBrand)],
    },
    // Store products filtered by brand and/or category
    {
      matcher: "/store/products-by-brand",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetProductsByBrandSchema, {
          defaults: [
            "id", "title", "handle", "thumbnail",
            "variants.*", "variants.calculated_price.*",
            "brand.*",
          ],
          isList: true,
        }),
      ],
    },
    // Store brand list
    {
      matcher: "/store/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name"],
          isList: true,
        }),
      ],
    },
  ],
})
