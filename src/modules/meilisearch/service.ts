import { MedusaError } from "@medusajs/framework/utils"

const { Meilisearch } = require("meilisearch")

type MeilisearchOptions = {
  host: string
  apiKey: string
  productIndexName: string
}

export type MeilisearchIndexType = "product"

export default class MeilisearchModuleService {
  private client: any
  private options: MeilisearchOptions

  constructor(_: any, options: MeilisearchOptions) {
    if (!options?.host || !options?.apiKey || !options?.productIndexName) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Meilisearch options are required: host, apiKey, productIndexName"
      )
    }
    this.client = new Meilisearch({ host: options.host, apiKey: options.apiKey })
    this.options = options
  }

  async getIndexName(type: MeilisearchIndexType): Promise<string> {
    switch (type) {
      case "product":
        return this.options.productIndexName
      default:
        throw new Error(`Invalid index type: ${type}`)
    }
  }

  async indexData(
    data: Record<string, unknown>[],
    type: MeilisearchIndexType = "product"
  ): Promise<void> {
    const index = this.client.index(await this.getIndexName(type))
    await index.addDocuments(data.map((item) => ({ ...item, id: item.id })))
  }

  async deleteFromIndex(
    documentIds: string[],
    type: MeilisearchIndexType = "product"
  ): Promise<void> {
    const index = this.client.index(await this.getIndexName(type))
    await index.deleteDocuments(documentIds)
  }

  async search(
    query: string,
    type: MeilisearchIndexType = "product"
  ): Promise<any> {
    const index = this.client.index(await this.getIndexName(type))
    return await index.search(query)
  }
}
