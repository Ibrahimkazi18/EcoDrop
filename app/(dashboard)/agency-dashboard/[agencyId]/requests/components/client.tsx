"use client"

import { Separator } from "@/components/ui/separator"
import { ReportColumn } from "./columns"
import Heading from "@/components/heading"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

interface RequestClientProps  {
  data : ReportColumn[],
  columns: ColumnDef<ReportColumn>[]
}

const RequestClient = ({ data, columns } : RequestClientProps) => {

  return (
    <>
        <div className="flex items-center justify-between">
            <Heading title={`Requests (${data.length})`} description="Manage requests for your agency"/>
        </div>

        <Separator />

        <DataTable columns={columns} data={data} searchKey="location" />
    </>
  )
}

export default RequestClient