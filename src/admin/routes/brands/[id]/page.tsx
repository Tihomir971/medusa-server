import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../../lib/sdk"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

type Brand = {
  id: string
  name: string
}

type BrandResponse = {
  brand: Brand
}

const BrandDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")

  const { data, isLoading } = useQuery<BrandResponse>({
    queryFn: () => sdk.client.fetch(`/admin/brands/${id}`),
    queryKey: [["brand", id]],
  })

  useEffect(() => {
    if (data?.brand) {
      setName(data.brand.name)
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (newName: string) =>
      sdk.client.fetch(`/admin/brands/${id}`, {
        method: "POST",
        body: { name: newName },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["brand", id]] })
      queryClient.invalidateQueries({ queryKey: [["brands"]] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/brands/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["brands"]] })
      navigate("/brands")
    },
  })

  const handleSave = () => {
    if (name.trim()) {
      updateMutation.mutate(name.trim())
    }
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text>Loading...</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Brand Details</Heading>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => {
                    if (window.confirm("Delete this brand?")) {
                      deleteMutation.mutate()
                    }
                  }}
                  isLoading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setEditing(false)
                    setName(data?.brand?.name || "")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  onClick={handleSave}
                  isLoading={updateMutation.isPending}
                >
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="grid grid-cols-2 items-center">
            <Text size="small" weight="plus" leading="compact">
              ID
            </Text>
            <Text size="small" leading="compact">
              {data?.brand?.id}
            </Text>
          </div>
          <div className="grid grid-cols-2 items-center">
            <Label htmlFor="brand-name">
              <Text size="small" weight="plus" leading="compact">
                Name
              </Text>
            </Label>
            {editing ? (
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <Text size="small" leading="compact">
                {data?.brand?.name}
              </Text>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default BrandDetailPage
