"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MapPin, UserPlus2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReportColumn = {
  id: string;
  location: string;
  amount: string;
  imageUrl: string;
  createdAt?: string;
};

export const createColumns = (openAssignModal: (report: ReportColumn) => void): ColumnDef<ReportColumn>[] => [
  {
    accessorKey: "location",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Location
        <MapPin className="ml-2 h-4 w-4 text-green-700" />
      </Button>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "assign",
    cell: ({ row }) => (
      <Button
        variant="outline"
        onClick={() => openAssignModal(row.original)}
      >
        <UserPlus2Icon className="h-4 w-4" />
      </Button>
    ),
  },
];
