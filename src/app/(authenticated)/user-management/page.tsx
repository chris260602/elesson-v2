"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Eye, Pencil, Trash, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { User } from "@/lib/validations/user"
import AxiosInstance from "@/utils/axiosInstance"

// Import your reusable Table Component
import { CTable } from "@/components/core/CTable"

// --- Columns Definition ---
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "username",
    header: "Username",
    
    },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>
  },
  {
    accessorKey: "active_role",
    header: "Role",
    cell: ({ row }) => {
        const role = row.getValue("active_role")
        // Handle if role is array or string
        const displayRole = Array.isArray(role) ? role[0] : role
        return (
            <div className="flex items-center">
               <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                 {displayRole}
               </span>
            </div>
        )
    }
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const val = row.getValue("active")
      const isActive = val === "Yes" || val === 1 || val === true
      
      return (
        <Badge 
          variant={isActive ? "default" : "destructive"} 
          className={isActive ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      const isActive = user.active === "Yes" || user.active === 1 || user.active === true

      const handleDeactivate = async () => {
         try {
            await AxiosInstance.get(`/api/v2/user/${user.id}/deactivate`)
            toast.success("User deactivated")
            window.location.reload() 
         } catch (e) { 
            toast.error("Error deactivating user") 
         }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/user-management/${user.id}/view`} className="cursor-pointer w-full flex items-center">
                <Eye className="mr-2 h-4 w-4" /> View
              </Link>
            </DropdownMenuItem>
            
            {isActive && (
              <DropdownMenuItem asChild>
                <Link href={`/user-management/${user.id}/edit`} className="cursor-pointer w-full flex items-center">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
            )}

            {isActive ? (
               <DropdownMenuItem onClick={handleDeactivate} className="text-red-600 cursor-pointer focus:text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => {}} className="text-green-600 cursor-pointer focus:text-green-600">
                <RefreshCw className="mr-2 h-4 w-4" /> Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function UserManagementPage() {
  const router = useRouter()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await AxiosInstance.get("/api/v2/users")
        setData(res.data.data || []) 
      } catch (error) {
        console.error("Failed to fetch users:", error)
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading users...</div>

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage user access and roles.</p>
        </div>
        <Button onClick={() => router.push("/user-management/add")} className="text-white">
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      <CTable 
        columns={columns} 
        data={data} 
        enableSorting={true}
        enablePagination={true}
        initialPageSize={10} 
      />
    </div>
  )
}