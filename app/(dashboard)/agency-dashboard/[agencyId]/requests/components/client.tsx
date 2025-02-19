"use client"

import { Separator } from "@/components/ui/separator"
import { ReportColumn } from "./columns"
import Heading from "@/components/heading"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Loader, RefreshCw } from "lucide-react"

interface RequestClientProps  {
  data : ReportColumn[],
  columns: ColumnDef<ReportColumn>[],
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const RequestClient = ({ data, columns, handleRefresh, isRefreshing } : RequestClientProps) => {

  return (
    <>
        <div className="flex items-center justify-between">
          <Heading title={`Requests (${data.length})`} description="Manage requests for your agency" />

          {/* Refresh Button */}
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

        <Separator />

        <DataTable columns={columns} data={data} searchKey="location" />
    </>
  )
}

export default RequestClient