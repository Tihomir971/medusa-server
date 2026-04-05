import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import {
  Heading,
  Button,
  Input,
  Label,
  Drawer,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

type Brand = {
  id: string
  name: string
}

type BrandsResponse = {
  brands: Brand[]
  count: number
  limit: number
  offset: number
}

const columnHelper = createDataTableColumnHelper<Brand>()

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
]

const BrandsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const limit = 15
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  })
  const offset = useMemo(() => {
    return pagination.pageIndex * limit
  }, [pagination])

  const { data, isLoading } = useQuery<BrandsResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/brands`, {
        query: { limit, offset },
      }),
    queryKey: [["brands", limit, offset]],
  })

  const table = useDataTable({
    columns,
    data: data?.brands || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick: (_, row) => {
      navigate(`/brands/${row.id}`)
    },
  })

  // Create brand drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      sdk.client.fetch(`/admin/brands`, {
        method: "POST",
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["brands"]] })
      setDrawerOpen(false)
      setNewBrandName("")
    },
  })

  const handleCreate = () => {
    if (newBrandName.trim()) {
      createMutation.mutate(newBrandName.trim())
    }
  }

  return (
    <>
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Brands</Heading>
          <Button size="small" onClick={() => setDrawerOpen(true)}>
            Create Brand
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Create Brand</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                placeholder="Brand name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Drawer.Close>
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
            >
              Save
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})

export default BrandsPage
