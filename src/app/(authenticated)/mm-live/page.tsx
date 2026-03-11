"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CTable } from "@/components/core/CTable";
import AxiosInstance from "@/utils/axiosInstance";

// Custom Components
import { CreateLiveClassDialog, CreateLiveClassFormValues } from "@/components/dialog/mmlive/CreateLiveClassDialog";
import { useSession } from "next-auth/react";
import { fetchClasses, fetchLiveClasses } from "@/apiRoutes/class";
import { LiveClassType } from "@/types/class";
import { FunButton } from "@/components/core/FunButton";


export default function MMLivePage() {
      const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LiveClassType | null>(null);

  const isStudent = session?.user.user.child_id; 
  console.log(session,"sesi")
  // --- QUERIES ---
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["elearning"],
    queryFn: fetchLiveClasses,
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (data: CreateLiveClassFormValues) => {
      const payload = {
          title: data.title,
          class: data.class_id, 
          server: data.server
      };
      return await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/elearning`, payload);
    },
    onSuccess: () => {
      toast.success("Online class created successfully");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["elearning"] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to create class");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await AxiosInstance.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/elearning/${id}`);
    },
    onSuccess: () => {
      toast.success("Deleted successfully");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["elearning"] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to delete class");
    }
  });

  // --- HANDLERS ---
  const handleJoin = (item: LiveClassType) => {
    const token = session?.user?.access_token;
    window.open(`${item.url}?token=${token}`, "_blank");
  };

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  // --- COLUMNS ---
  const columns: ColumnDef<LiveClassType>[] = [
    { accessorKey: "class", header: "Class" },
    { accessorKey: "title", header: "Title" },
    { 
      accessorKey: "server", 
      header: "Server",
      cell: ({ row }) => capitalize(row.original.server)
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase();
        const isOpen = status === "open" || status === "active";
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
            {status ? capitalize(status) : "Unknown"}
            </span>
        )
      }
    },
    { accessorKey: "created_at", header: "Created at" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            className=" h-8 px-3" 
            onClick={() => handleJoin(row.original)}
          >
            <ExternalLink className="h-3 w-3 mr-1" /> Join
          </Button>
          
          {!isStudent && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-8 px-3"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl">MM LIVE Classroom</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
              <RotateCcw className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {!isStudent && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New online class
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <CTable columns={columns} data={items} />
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center text-center">
        <h2 className="text-lg font-bold text-slate-700 max-w-2xl">
          MM LIVE (Learning with Integrated Vizualizer Enhanced) is only available for Online Classes only
        </h2>
      </div>

      <CreateLiveClassDialog 
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        classes={classes}
        isLoading={createMutation.isPending}
        onSubmit={(data) => createMutation.mutate(data)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Once deleted, you will not be able to recover this class session!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.meeting_id);
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Yes, delete it!"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}