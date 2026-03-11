"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Pencil, Trash2, ArrowUpDown, Eye, Plus, RotateCcw, 
  Search, Loader2, BookOpen, CloudDownload 
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CTable } from "@/components/core/CTable"; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import API and Types
import { RevisionProblem } from "@/types/revision";
import { SwapDialog } from "@/components/dialog/revision-word/SwapDialog";
import { PreviewDialog } from "@/components/dialog/revision-word/PreviewDialog";
import { RevisionFormDialog } from "@/components/dialog/revision-word/RevisionFormDialog";
import { fetchLevels } from "@/apiRoutes/level";
import { fetchTopics } from "@/apiRoutes/topic";
import { fetchQuestions, fetchQuestionDetails } from "@/apiRoutes/revision-words"; 

export default function RevisionPage() {
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ level: "0", topic: "0" });
  
  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Partial<RevisionProblem>>({});
  const [deleteTarget, setDeleteTarget] = useState<RevisionProblem | null>(null);

  // 1. FETCH LEVELS
  const { data: levelsResponse } = useQuery({ 
    queryKey: ["levels"], 
    queryFn: fetchLevels,
    staleTime: 1000 * 60 * 60 
  });
  
  const levelOptions = levelsResponse?.data || [];

  // 2. FETCH TOPICS
  const { data: topicsResponse } = useQuery({ 
    queryKey: ["topics", filters.level],
    queryFn: () => {
        const param = filters.level === "0" ? "" : filters.level;
        return fetchTopics(param);
    },
  });

  const topicOptions = Array.isArray(topicsResponse) 
      ? topicsResponse 
      : (topicsResponse?.data || []);

  // 3. FETCH QUESTIONS
  const { 
      data: itemsResponse, 
      isLoading: isInitialLoading, 
      isFetching: isBackgroundLoading,
      refetch: loadData 
  } = useQuery({ 
    queryKey: ["revision", filters.level, filters.topic], 
    queryFn: () => {
        const levelParam = filters.level === "0" ? "" : filters.level;
        const topicParam = filters.topic === "0" ? "" : filters.topic;
        return fetchQuestions(levelParam, topicParam);
    },
    refetchOnWindowFocus: false,
  });

  const items = Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse?.data || []);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lower = searchQuery.toLowerCase();
    
    return items.filter((item: RevisionProblem) => 
      item.comment?.toLowerCase().includes(lower) || 
      item.created_by_label?.toLowerCase().includes(lower) ||
      item.question_no?.toString().includes(lower)
    );
  }, [items, searchQuery]);

  // Handlers
  const handleNew = () => {
      setEditingItem({});
      setIsFormLoading(false);
      setIsFormOpen(true);
  };

  const handleEdit = async (item: RevisionProblem) => {
      setEditingItem({});
      setIsFormOpen(true);
      setIsFormLoading(true);
      try {
        const fullDetails = await fetchQuestionDetails(item.id);
        setEditingItem(fullDetails);
      } catch (e) {
        toast.error("Failed to fetch details");
        setIsFormOpen(false);
      } finally {
        setIsFormLoading(false);
      }
  };

  const handlePreview = async (item: RevisionProblem) => {
      setEditingItem({}); 
      setIsPreviewOpen(true);
      setIsPreviewLoading(true);
      try {
        const fullDetails = await fetchQuestionDetails(item.id);
        setEditingItem(fullDetails);
      } catch(e) {
        toast.error("Failed to fetch preview");
        setIsPreviewOpen(false);
      } finally {
        setIsPreviewLoading(false);
      }
  };

  const handleSwap = (item: RevisionProblem) => {
      setEditingItem(item);
      setIsSwapOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
        await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${deleteTarget.id}`);
        toast.success("Deleted successfully");
        loadData();
    } catch (error) {
        toast.error("Failed to delete");
    } finally {
        setDeleteTarget(null);
    }
  };

  // Table Columns
  const columns: ColumnDef<RevisionProblem>[] = [
    { 
        id: "actions",
        header: "Options",
        cell: ({row}) => (
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row.original)}><Pencil className="h-4 w-4 text-blue-600"/></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(row.original)}><Trash2 className="h-4 w-4 text-red-600"/></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSwap(row.original)}><ArrowUpDown className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(row.original)}><Eye className="h-4 w-4"/></Button>
            </div>
        )
    },
    { accessorKey: "comment", header: "Comment" },
    { accessorKey: "level_label", header: "Level" },
    { accessorKey: "subject_label", header: "Topic" },
    { accessorKey: "question_no", header: "Q No." },
    { 
      accessorKey: "difficulty", 
      header: "Difficulty",
      cell: ({ getValue }) => <div className="flex text-yellow-500">{"★".repeat(getValue() as number)}</div>
    },
    { 
      accessorKey: "created_by_label", 
      header: "Created By",
      cell: ({ getValue }) => <Badge variant="secondary">{getValue() as string}</Badge> 
    },
  ];

  return (
    <div>
       <Card className="relative overflow-hidden min-h-[600px]">
          {/* Top Loading Bar */}
          {isBackgroundLoading && !isInitialLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-10">
                <div className="h-full bg-blue-500 transition-all duration-300 ease-in-out animate-progress" />
            </div>
          )}

          <CardHeader className="space-y-6">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Revision Word Problems
                    </CardTitle>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => loadData()}
                                    disabled={isInitialLoading || isBackgroundLoading}
                                >
                                    <RotateCcw className={`h-4 w-4 ${isInitialLoading || isBackgroundLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Refresh Data</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {isBackgroundLoading && !isInitialLoading && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 px-3 py-1 rounded-full animate-pulse ml-2">
                            <CloudDownload className="h-3 w-3" /><span>Fetching...</span>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <Button onClick={handleNew} className="gap-2 bg-cyan-600 hover:bg-cyan-700" size="sm">
                        <Plus className="h-4 w-4"/> New Item
                    </Button>
                </div>
             </div>

             {/* Filters */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-100/50 border rounded-lg items-end">
                
                {/* 1. LEVEL FILTER */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Primary Level</Label>
                    <Select 
                        value={filters.level} 
                        onValueChange={v => setFilters(prev => ({ ...prev, level: v, topic: "0" }))}
                    >
                        <SelectTrigger className="bg-white w-full"><SelectValue placeholder="All Levels" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">All Levels</SelectItem>
                            {levelOptions.map((l: any) => (
                                <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. TOPIC FILTER */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Topic</Label>
                    <Select 
                        value={filters.topic} 
                        onValueChange={v => setFilters(prev => ({...prev, topic: v}))}
                        disabled={filters.level === "0" && topicOptions.length === 0}
                    >
                        <SelectTrigger className="bg-white w-full"><SelectValue placeholder="All Topics" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">All Topics</SelectItem>
                            {topicOptions.map((t: any) => (
                                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 relative">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search comments..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            className="pl-9 bg-white"
                        />
                        {isBackgroundLoading && !isInitialLoading && (<div className="absolute right-3 top-2.5"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>)}
                    </div>
                </div>
             </div>
          </CardHeader>

          <CardContent>
             {isInitialLoading ? (
                <div className="h-48 flex flex-col gap-2 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading questions...</span>
                 </div>
             ) : (
                <div className="animate-in fade-in duration-500">
                    <CTable columns={columns} data={filteredItems} />
                    <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                        <div>Showing {filteredItems.length} records</div>
                        {isBackgroundLoading && (<div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /><span>Updating records...</span></div>)}
                     </div>
                </div>
             )}
          </CardContent>
       </Card>

       {/* Floating Loading Badge */}
       {isBackgroundLoading && !isInitialLoading && (
        <div className="fixed bottom-4 right-4 z-50">
             <Badge variant="secondary" className="shadow-lg border gap-2 py-1.5 px-3"><Loader2 className="h-3 w-3 animate-spin" />Loading Data</Badge>
        </div>
      )}

       {/* DIALOGS */}
       <RevisionFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
          initialData={editingItem}
          isLoading={isFormLoading}
          levels={{ data: levelOptions }} 
          onSuccess={() => { loadData(); setIsFormOpen(false); }}
       />

       <PreviewDialog 
          open={isPreviewOpen} 
          onOpenChange={setIsPreviewOpen} 
          data={editingItem as RevisionProblem} 
          isLoading={isPreviewLoading}
       />

       <SwapDialog 
          open={isSwapOpen} 
          onOpenChange={setIsSwapOpen}
          item={editingItem as RevisionProblem}
          onSuccess={() => { loadData(); setIsSwapOpen(false); }}
       />

       <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete this question? This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}