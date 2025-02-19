"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { Loader, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { VolunteerColumn, columns } from "./columns"
import Heading from "@/components/heading"
import { DataTable } from "@/components/ui/data-table"

interface ProductClientProps  {
  data : VolunteerColumn[],
  agencyId: string;
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const ProductClient = ({ data, agencyId, handleRefresh, isRefreshing } : ProductClientProps) => {
  const router = useRouter()

  return (
    <>
        <div className="flex items-center justify-between">
            <Heading title={`Volunteers (${data.length})`} description="Manage volunteers for your agency"/>

            <div className="flex items-center space-x-2">
              <Button onClick={() => router.push(`/agency-dashboard/${agencyId}/volunteers/create`)}>
                  <Plus className="h-4 w-4 mr-2"/>
                  Add New
              </Button>

              <button 
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {isRefreshing ? (
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-5 w-5 mr-2" />
                )}
                Refresh
              </button>
            </div>
        </div>

        <Separator />

        <DataTable columns={columns} data={data} searchKey="username" />
    </>
  )
}

export default ProductClient