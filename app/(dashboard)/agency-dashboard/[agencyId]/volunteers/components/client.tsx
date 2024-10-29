"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { VolunteerColumn, columns } from "./columns"
import Heading from "@/components/heading"
import { DataTable } from "@/components/ui/data-table"

interface ProductClientProps  {
  data : VolunteerColumn[],
  agencyId: string;
}

const ProductClient = ({ data, agencyId } : ProductClientProps) => {
  const router = useRouter()

  return (
    <>
        <div className="flex items-center justify-between">
            <Heading title={`Volunteers (${data.length})`} description="Manage volunteers for your agency"/>
            <Button onClick={() => router.push(`/agency-dashboard/${agencyId}/volunteers/create`)}>
                <Plus className="h-4 w-4 mr-2"/>
                Add New
            </Button>
        </div>

        <Separator />

        <DataTable columns={columns} data={data} searchKey="username" />
    </>
  )
}

export default ProductClient