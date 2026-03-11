"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Search, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Custom Components & Utilities
import { TopicDialog } from "@/components/dialog/topic/TopicDialog";
import AxiosInstance from "@/utils/axiosInstance";
import { fetchLevels, LevelResponseType } from "@/apiRoutes/level";
import { fetchTopics } from "@/apiRoutes/topic";
import { TopicType } from "@/types/topic";


export default function TopicsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TopicType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TopicType | null>(null);

  // --- QUERIES ---
  const { data: levels = {data:[],meta:{current_page:0,last_page:0,total:0}} as LevelResponseType } = useQuery({ 
      queryKey: ["levels"], 
      queryFn: ()=>fetchLevels(),
      staleTime: 1000 * 60 * 60 
  });

  const { data: topics = [], isLoading, isFetching } = useQuery({ 
      queryKey: ["topics"], 
      queryFn: ()=>fetchTopics({}) 
  });

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (newData: Partial<TopicType>) => {
      return await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic`, newData);
    },
    onSuccess: () => {
      toast.success("New topic created");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to create topic");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<TopicType>) => {
      return await AxiosInstance.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic/${data.id}`, data);
    },
    onSuccess: () => {
      toast.success("Topic updated");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to update topic");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await AxiosInstance.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic/${id}`);
    },
    onSuccess: () => {
      toast.success("Topic deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to delete topic");
    }
  });

  // --- HANDLERS ---
  const filteredTopics = topics.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: TopicType) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (formData: Partial<TopicType>) => {
    if (editingItem) {
      updateMutation.mutate({ ...formData, id: editingItem.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  // --- COLUMNS ---
  const columns: ColumnDef<TopicType>[] = [
    {
      accessorKey: "name",
      header: "Topic Name",
      cell: ({ row }) => <span className="font-semibold text-slate-700">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "available_level",
      header: "Level",
      cell: ({ row }) => {
        const levels = (row.getValue("available_level") as string[]) || [];
        const sortedLevels = [...levels].sort(); 
        
        return (
          <div className="flex flex-wrap gap-1">
            {sortedLevels.length > 0 ? (
                sortedLevels.map((lvl) => (
                <Badge key={lvl} variant="secondary" className="px-2 py-0.5 text-xs font-medium border-slate-200">
                    {lvl}
                </Badge>
                ))
            ) : (
                <span className="text-slate-400 italic text-xs">No levels assigned</span>
            )}
          </div>
        );
      },
    },
    {
      id: "option",
      header: "Option",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} title="Edit">
            <Pencil className="h-4 w-4 text-slate-500 hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)} title="Delete">
            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4">
          
          {/* Row 1: Title and Add Button */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold text-slate-800">Topic Management</CardTitle>
                {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>}
            </div>
            
            <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" /> New Topic
            </Button>
          </div>

          {/* Row 2: Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white w-full"
            />
          </div>

        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading topics...</span>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
                <CTable columns={columns} data={filteredTopics} />
                <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
                    Showing {filteredTopics.length} records
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- REUSABLE TOPIC DIALOG --- */}
      <TopicDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingItem}
        levels={levels}
        onSubmit={handleFormSubmit}
        isLoading={isSaving}
      />

      {/* --- DELETE ALERT --- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
              <br/>This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
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