"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { LEVELS_QUERY_KEY, TOPICS_QUERY_KEY, SCHEDULE_TERMS_QUERY_KEY } from "@/const/queryKey";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus, Pencil, Trash2, Eye, RotateCcw, Loader2,
  Search, CheckSquare, XSquare, ChevronDown, CloudDownload
} from "lucide-react";
import { format } from "date-fns";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

// --- CUSTOM COMPONENTS ---
import { CTable } from "@/components/core/CTable";
import { LessonTemplateDialog } from "@/components/dialog/elesson/LessonTemplateDialog";
import { PreviewLessonDialog } from "@/components/dialog/elesson/PreviewLessonDialog";
import { DeleteTemplateDialog } from "@/components/dialog/template/DeleteTemplateDialog";

// --- API ---
import { fetchTemplates, deleteTemplate, togglePublishTemplate } from "@/apiRoutes/template";
import { fetchLevels } from "@/apiRoutes/level";
import { fetchTopics } from "@/apiRoutes/topic";
import { fetchTerms } from "@/apiRoutes/main";
import { TermType } from "@/types/main";
import { TemplateItem } from "@/types/template";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";

export default function TemplatesPage() {

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [templateData, setTemplateData] = useState<TemplateItem[]>([]);

  // Loading States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [backgroundLoadingProgress, setBackgroundLoadingProgress] = useState(0);

  // Specific Loading state for publishing
  const [publishingId, setPublishingId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Target States for actions
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [publishTarget, setPublishTarget] = useState<TemplateItem | null>(null); // NEW: For confirmation
  const [editingItem, setEditingItem] = useState<TemplateItem>();
  const [createMode, setCreateMode] = useState<"normal" | "topical" | "revision">("normal");

  // --- DATA FETCHING (Incremental) ---
  const loadData = useCallback(async () => {
    setIsInitialLoading(true);
    setIsBackgroundLoading(true);
    setTemplateData([]);
    setBackgroundLoadingProgress(0);

    try {
      const limit = 200;
      const firstRes = await fetchTemplates(limit, 1);
      const firstData = firstRes.data;
      setTemplateData(firstData);
      setIsInitialLoading(false);

      const meta = firstRes.meta;
      if (meta && meta.last_page > 1) {
        let totalFetched = 1;
        for (let p = 2; p <= meta.last_page; p++) {
          try {
            const nextRes = await fetchTemplates(limit, p);
            const nextPageData = Array.isArray(nextRes.data) ? nextRes.data : [];
            setTemplateData((prev) => [...prev, ...nextPageData]);
            totalFetched++;
            setBackgroundLoadingProgress(Math.round((totalFetched / meta.last_page) * 100));
          } catch (err) {
            console.error(`Failed to fetch page ${p}`, err);
          }
        }
      }
      setBackgroundLoadingProgress(100);
    } catch (error) {
      console.error("Failed to load templates", error);
      showErrorMessage("Failed to load templates. Please try again.");
    } finally {
      setIsInitialLoading(false);
      setIsBackgroundLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- REACT QUERY HOOKS ---
  const { data: levels = { data: [] } } = useQuery({ queryKey: [LEVELS_QUERY_KEY], queryFn: () => fetchLevels() });
  const { data: topics = [] } = useQuery({ queryKey: [TOPICS_QUERY_KEY], queryFn: () => fetchTopics({}) });

  const { data: termsData = [] } = useQuery({
    queryKey: [SCHEDULE_TERMS_QUERY_KEY],
    queryFn: fetchTerms
  });

  // --- ACTIONS ---
  const handleCreate = (mode: "normal" | "topical" | "revision") => {
    setCreateMode(mode);
    setEditingItem(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (item: TemplateItem) => {
    if (item.topical_label === "Yes") setCreateMode("topical");
    else if (item.active_revision_label === "Yes") setCreateMode("revision");
    else setCreateMode("normal");

    setEditingItem(item);
    setDialogOpen(true);
  };

  // 1. Initial trigger: Just sets the target to open the confirmation dialog
  const initiatePublishToggle = (item: TemplateItem) => {
    setPublishTarget(item);
  };

  // 2. Confirmed Action: Executes the API call
  const handleConfirmPublish = async () => {
    if (!publishTarget) return;

    const item = publishTarget;
    const newStatus = !item.published;
    const actionWord = newStatus ? "publish" : "unpublish";

    // Start Loading
    setPublishingId(item.id);

    try {
      // Perform API call
      await togglePublishTemplate(item.id, newStatus, item.topical_label === "Yes");

      // Update UI state only on success
      setTemplateData(prev => prev.map(t => t.id === item.id ? { ...t, published: newStatus } : t));
      showSuccessMessage(`Template ${actionWord}ed successfully`);
    } catch (error) {
      console.error(error);
      showErrorMessage(`Failed to ${actionWord} template`);
    } finally {
      // Cleanup
      setPublishingId(null);
      setPublishTarget(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(deleteTarget.id);
      showSuccessMessage("Template deleted successfully");
      setTemplateData(prev => prev.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      showErrorMessage("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- COLUMNS ---
  const columns: ColumnDef<TemplateItem>[] = [
    { accessorKey: "year", header: "Year", size: 80 },
    { accessorKey: "term", header: "Term", size: 100 },
    {
      id: "topical",
      header: "Topical",
      accessorFn: (row) => row.topical_label,
      cell: ({ row }) => <Badge variant={row.original.topical_label === "Yes" ? "default" : "outline"}>{row.original.topical_label}</Badge>,
    },
    {
      id: "active_revision",
      header: "Active Revision",
      accessorFn: (row) => row.active_revision_label,
      cell: ({ row }) => <Badge variant={row.original.active_revision_label === "Yes" ? "secondary" : "outline"}>{row.original.active_revision_label}</Badge>,
    },
    {
      id: "level",
      header: "Level",
      accessorFn: (row) => row.level_primary?.code || "-",
    },
    {
      accessorKey: "published_at",
      header: "Publish Date",
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return date ? format(new Date(date), "yyyy-MM-dd") : "-";
      }
    },
    {
      accessorKey: "published",
      header: "Published",
      cell: ({ row }) => (
        <span className={row.original.published ? "text-green-600 font-medium" : "text-muted-foreground"}>
          {row.original.published ? "Published" : "Not Published"}
        </span>
      )
    },
    {
      id: "option",
      header: "Option",
      cell: ({ row }) => {
        const item = row.original;
        const isPublishingThis = publishingId === item.id;

        return (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(item)} data-testid="delete-template-btn"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)} data-testid="edit-template-btn"><Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setPreviewOpen(true); }} data-testid="preview-template-btn"><Eye className="h-4 w-4 text-muted-foreground hover:text-blue-500" /></Button></TooltipTrigger><TooltipContent>Preview</TooltipContent></Tooltip>
            </TooltipProvider>

            {/* PUBLISH BUTTON WITH LOADING STATE */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => initiatePublishToggle(item)}
                    disabled={isPublishingThis}
                    data-testid="publish-template-btn"
                  >
                    {isPublishingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      item.published ? <XSquare className="h-4 w-4 text-red-500" /> : <CheckSquare className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.published ? "Unpublish Template" : "Publish Template"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      }
    }
  ];

  // --- FILTERING ---
  const filteredData = useMemo(() => {
    if (!searchQuery) return templateData;
    const lowerQ = searchQuery.toLowerCase();
    return templateData.filter((item) =>
      item.title?.toLowerCase().includes(lowerQ) ||
      (item.level_primary?.code || "").toLowerCase().includes(lowerQ) ||
      String(item.year).includes(lowerQ)
    );
  }, [templateData, searchQuery]);

  return (
    <div className="space-y-4 p-4 md:p-8">
      <Card className="relative overflow-hidden">
        {isBackgroundLoading && !isInitialLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-10">
            <div className="h-full bg-blue-500 transition-all duration-300 ease-in-out" style={{ width: `${backgroundLoadingProgress}%` }} />
          </div>
        )}

        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <CardTitle>E-Lessons</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={loadData} disabled={isInitialLoading || isBackgroundLoading}>
                    <RotateCcw className={`h-4 w-4 ${isInitialLoading || isBackgroundLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Refresh Data</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isBackgroundLoading && !isInitialLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 px-3 py-1 rounded-full animate-pulse">
                <CloudDownload className="h-3 w-3" /><span>Fetching... {backgroundLoadingProgress}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" data-testid="new-item-trigger"><Plus className="h-4 w-4" /> New Item <ChevronDown className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCreate("normal")} data-testid="new-elesson-item">New E-lesson</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate("topical")} data-testid="new-topical-item">New Topical</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate("revision")} data-testid="new-revision-item">New Active Revision Class</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          {isInitialLoading ? (
            <div className="flex h-64 items-center justify-center flex-col gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Initializing templates...</span>
            </div>
          ) : (
            <>
              <CTable
                columns={columns}
                data={filteredData}
                state={{ rowSelection }}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => String(row.id)}
              />
              <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                <div>Showing {filteredData.length} records</div>
                {isBackgroundLoading && (<div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /><span>Loading more records...</span></div>)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* --- DIALOGS --- */}
      {dialogOpen && (
        <LessonTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialData={editingItem}
          mode={createMode}
          levels={levels.data}
          topics={topics}
          terms={termsData}
          onSuccess={() => { loadData(); }}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <DeleteTemplateDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        target={deleteTarget}
      />

      {/* PREVIEW */}
      {previewOpen && editingItem && (
        <PreviewLessonDialog open={previewOpen} onOpenChange={setPreviewOpen} item={editingItem} />
      )}

      {/* PUBLISH / UNPUBLISH CONFIRMATION DIALOG */}
      <AlertDialog open={!!publishTarget} onOpenChange={(open) => !open && setPublishTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {publishTarget?.published ? "Unpublish Template?" : "Publish Template?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {publishTarget?.published ? "unpublish" : "publish"} this template?
              {publishTarget?.published
                ? " It will no longer be visible to students/users."
                : " It will become visible to students/users immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPublish} className={publishTarget?.published ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}>
              {publishTarget?.published ? "Unpublish" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}