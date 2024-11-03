"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import CellAction from "./cell-action"

// This type is used to define the shape of our data.
export type VolunteerColumn = {
  id : string,
  username : string,
  email : string,        
  status: "available" | "working" | "unavailable";      
  hasSetPermanentPassword: boolean;
  createdAt?: string,
}

export const columns: ColumnDef<VolunteerColumn>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "email",
    header : "Email"
  },
  {
    accessorKey: "status",
    header : "Status"
  },
  {
    accessorKey: "hasSetPermanentPassword",
    header : "Password Set"
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    id : "actions",
    cell: ({row}) => <CellAction data={row.original} />
  }
]
