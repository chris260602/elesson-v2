"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LEVELS_QUERY_KEY, TOPICS_QUERY_KEY, ARCHIVED_YEARS_QUERY_KEY, WORKSHEETS_QUERY_KEY } from "@/const/queryKey";
import { invalidateWorksheets } from "@/utils/tanStackUtils";
import { ColumnDef } from "@tanstack/react-table";
import {
    Plus, Pencil, Trash2, Archive, Copy, QrCode,
    Search, RotateCcw, Loader2, FileSpreadsheet, CloudDownload
} from "lucide-react";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- CUSTOM COMPONENTS ---
import { CTable } from "@/components/core/CTable";
import { WorksheetFormDialog } from "@/components/dialog/worksheet/WorksheetFormDialog";
import { ArchiveWorksheetDialog } from "@/components/dialog/worksheet/ArchiveWorksheetDialog";
import { QrCodeDialog } from "@/components/dialog/core/QrCodeDialog";
import { ArchiveSelectedWorksheetDialog } from "@/components/dialog/worksheet/ArchiveSelectedWorksheetDialog";
import { DeleteWorksheetDialog } from "@/components/dialog/worksheet/DeleteWorksheetDialog";
import { CloneWorksheetDialog } from "@/components/dialog/worksheet/CloneWorksheetDialog";

// --- TYPES & API ---
import { WorksheetItem, WorksheetDetail } from "@/types/worksheet";
import { fetchLevels } from "@/apiRoutes/level";
import { fetchTopics } from "@/apiRoutes/topic";
import {
    archiveSelectedWorksheets,
    archiveWorksheetsByYear,
    cloneWorksheet,
    deleteWorksheet,
    deleteWorksheetMedia,
    fetchArchivedWorksheetYears,
    fetchWorksheetDetail,
    fetchWorksheets,
    QrRequestPayload,
    saveWorksheet,
    updateWorksheetMedia
} from "@/apiRoutes/worksheets";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";




export default function WorksheetsPage() {
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ level: "0", topic: "0" });
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    const [isArchiving, setIsArchiving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCloning, setIsCloning] = useState(false);

    const [isFormSaving, setIsFormSaving] = useState(false);
    const [isFormLoading, setIsFormLoading] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isArchiveSelectedConfirmOpen, setIsArchiveSelectedConfirmOpen] = useState(false);
    const [isQrOpen, setIsQrOpen] = useState(false);

    const [qrRequest, setQrRequest] = useState<QrRequestPayload | null>(null);
    const [editingItem, setEditingItem] = useState<WorksheetDetail | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WorksheetItem | null>(null);
    const [cloneTarget, setCloneTarget] = useState<WorksheetItem | null>(null);

    const { data: levels = { data: [], meta: { current_page: 0, last_page: 0, total: 0 } } } = useQuery({
        queryKey: [LEVELS_QUERY_KEY],
        queryFn: () => fetchLevels(),
        staleTime: 1000 * 60 * 60
    });

    const { data: topics = [] } = useQuery({
        queryKey: [TOPICS_QUERY_KEY, filters.level],
        queryFn: () => fetchTopics({ level: filters.level }),
        enabled: true
    });

    const { data: archiveYears = [] } = useQuery({
        queryKey: [ARCHIVED_YEARS_QUERY_KEY],
        queryFn: fetchArchivedWorksheetYears,
        staleTime: 1000 * 60 * 5
    });

    const { data: worksheets = [], isLoading: isInitialLoading, isFetching: isBackgroundLoading, refetch: loadData } = useQuery<WorksheetItem[]>({
        queryKey: [WORKSHEETS_QUERY_KEY],
        queryFn: async () => {
            const allWorksheets: WorksheetItem[] = [];
            const firstRes = await fetchWorksheets(200, 1);
            const firstData = Array.isArray(firstRes.data) ? firstRes.data : [];
            allWorksheets.push(...firstData);

            const meta = !Array.isArray(firstRes.data) ? firstRes.meta : null;
            if (meta && meta.last_page > 1) {
                for (let p = 2; p <= meta.last_page; p++) {
                    const nextRes = await fetchWorksheets(200, p);
                    const nextPageData = Array.isArray(nextRes.data) ? nextRes.data : [];
                    allWorksheets.push(...nextPageData);
                }
            }
            return allWorksheets;
        },
        refetchOnWindowFocus: false,
    });


    const filteredData = useMemo(() => {
        // Define explicit types for level and topic items to remove 'any'
        type LevelFilterItem = { id: string | number; code: string; name: string };
        type TopicFilterItem = { id: string | number; name: string };

        const typedLevels = levels.data as LevelFilterItem[];
        const typedTopics = topics as TopicFilterItem[];

        return worksheets.filter(item => {
            const searchLower = searchQuery.toLowerCase();

            const matchesSearch = item.title?.toLowerCase().includes(searchLower) ||
                (item.levelName || "").toLowerCase().includes(searchLower);

            const matchesLevel = filters.level === "0"
                ? true
                : typedLevels.find(l => String(l.id) === String(filters.level))?.code === item.levelName;

            const matchesTopic = filters.topic === "0"
                ? true
                : typedTopics.find(t => t.name === filters.topic)?.name === item.topicName;

            return matchesSearch && matchesLevel && matchesTopic;
        });
    }, [worksheets, searchQuery, filters.level, filters.topic, levels.data, topics]);

    const handleArchiveSelected = async () => {
        setIsArchiving(true);
        try {
            const selectedIndices = Object.keys(rowSelection);
            const selectedIds = selectedIndices.map(index => filteredData[parseInt(index)]?.id).filter(Boolean);

            if (selectedIds.length === 0) {
                showErrorMessage("No items selected");
                setIsArchiving(false);
                return;
            }
            await archiveSelectedWorksheets(selectedIds);
            showSuccessMessage(`Successfully archived ${selectedIds.length} worksheets`);
            setIsArchiveSelectedConfirmOpen(false);
            invalidateWorksheets(queryClient);
        } catch (error: any) {
            showErrorMessage(error.response?.data?.message || "Failed to archive worksheets");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleArchiveByYear = async (year: string) => {
        setIsArchiving(true);
        try {
            await archiveWorksheetsByYear(year);
            showSuccessMessage(`Successfully archived worksheets for ${year}`);
            setIsArchiveOpen(false);
            invalidateWorksheets(queryClient);
        } catch (error: any) {
            showErrorMessage(error.response?.data?.message || "Failed to archive worksheets by year");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteWorksheet(deleteTarget.id);
            showSuccessMessage("Worksheet deleted successfully");
            setDeleteTarget(null);
            invalidateWorksheets(queryClient);
        } catch (error: any) {
            showErrorMessage(error.response?.data?.message || "Failed to delete worksheet");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClone = async () => {
        if (!cloneTarget) return;
        setIsCloning(true);
        try {
            await cloneWorksheet(cloneTarget.id);
            showSuccessMessage("Worksheet cloned successfully");
            setCloneTarget(null);
            invalidateWorksheets(queryClient);
        } catch (error: any) {
            showErrorMessage(error.response?.data?.message || "Failed to clone worksheet");
        } finally {
            setIsCloning(false);
        }
    };

    const handleCreate = () => {
        setEditingItem({
            id: "0", title: "", year: new Date().getFullYear().toString(), level: undefined, topic: "",
            videos: [], graphics: [], latest_worksheets: [], created_by: "",
            levelName: "", topicName: "", qrcode_name: "", updated_by: ""
        });
        setIsFormOpen(true);
    };

    const handleEdit = async (item: WorksheetItem) => {
        setEditingItem(item as unknown as WorksheetDetail);
        setIsFormOpen(true);

        setIsFormLoading(true);

        try {
            const fullDetails = await fetchWorksheetDetail(item.id);
            setEditingItem(fullDetails);
        } catch (error) {
            showErrorMessage("Failed to load full worksheet details");
        } finally {
            setIsFormLoading(false);
        }
    };

    const handleFetchTopicsForForm = async (levelId: string) => {
        return await fetchTopics({ level: levelId });
    };

    const handleSaveMetadata = async (data: WorksheetDetail) => {
        setIsFormSaving(true);
        try {
            const result = await saveWorksheet(data);
            showSuccessMessage(data.id === "0" ? "Worksheet created" : "Metadata updated");
            return result;
        } catch (error: any) {
            showErrorMessage(error.message || "Failed to save");
            throw error;
        } finally {
            setIsFormSaving(false);
        }
    };

    const handleDeleteFile = async (mediaId: number) => {
        await deleteWorksheetMedia(mediaId);
        return true;
    };

    const columns: ColumnDef<WorksheetItem>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px]"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        { accessorKey: "title", header: "Worksheet Title" },
        { accessorKey: "year", header: "Year" },
        { accessorKey: "levelName", header: "Level" },
        { accessorKey: "topicName", header: "Topic" },
        { accessorKey: "created_by", header: "Created By" },
        {
            id: "actions",
            header: "Option",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setCloneTarget(row.original)} title="Clone"><Copy className="h-4 w-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setQrRequest({ type: 'worksheet', id: row.original.id }); setIsQrOpen(true); }}><QrCode className="h-4 w-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
            )
        }
    ];

    const selectedRowsCount = Object.keys(rowSelection).length;

    return (
        <div>
            <Card className="relative overflow-hidden min-h-[600px]">
                {isBackgroundLoading && !isInitialLoading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-10">
                        <div className="h-full bg-blue-500 transition-all duration-300 ease-in-out" />
                    </div>
                )}

                <CardHeader className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                                Active Worksheets
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
                            <Button onClick={handleCreate} className="gap-2" size="sm">
                                <Plus className="h-4 w-4" /> Add Worksheet
                            </Button>

                            {selectedRowsCount === 0 ? (
                                <Button variant="outline" onClick={() => setIsArchiveOpen(true)} className="gap-2" size="sm">
                                    <Archive className="h-4 w-4 text-muted-foreground" /> Archive by Year
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="gap-2 bg-slate-800 text-white hover:bg-slate-700"
                                    onClick={() => setIsArchiveSelectedConfirmOpen(true)}
                                    size="sm"
                                >
                                    <Archive className="h-4 w-4" /> Archive Selected <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-[20px] bg-slate-600 text-white">{selectedRowsCount}</Badge>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-100/50 dark:bg-gray-700/50 border rounded-lg items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Primary Level</Label>
                            <Select value={filters.level} onValueChange={v => setFilters(prev => ({ ...prev, level: v, topic: "0" }))}>
                                <SelectTrigger className="bg-white w-full"><SelectValue placeholder="All Levels" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">All Levels</SelectItem>
                                    {levels.data.map((l) => (
                                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Topic</Label>
                            <Select value={filters.topic} onValueChange={v => setFilters({ ...filters, topic: v })}>
                                <SelectTrigger className="bg-white w-full"><SelectValue placeholder="All Topics" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">All Topics</SelectItem>
                                    {topics.map((t) => (
                                        <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 relative">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title..."
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
                            <span className="text-sm text-muted-foreground">Initializing worksheets...</span>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            <CTable
                                columns={columns}
                                data={filteredData}
                                state={{ rowSelection }}
                                onRowSelectionChange={setRowSelection}
                            />
                            <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                                <div>Showing {filteredData.length} records</div>
                                {isBackgroundLoading && (<div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /><span>Loading more records...</span></div>)}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isBackgroundLoading && !isInitialLoading && (
                <div className="fixed bottom-4 right-4 z-50">
                    <Badge variant="secondary" className="shadow-lg border gap-2 py-1.5 px-3"><Loader2 className="h-3 w-3 animate-spin" />Loading Data</Badge>
                </div>
            )}

            {isFormOpen && editingItem && (
                <WorksheetFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    initialData={editingItem}
                    levels={levels.data}
                    topics={topics}

                    onFetchTopics={handleFetchTopicsForForm}
                    onSaveMetadata={handleSaveMetadata}
                    onPatchWorksheet={updateWorksheetMedia}
                    onDeleteFile={handleDeleteFile}

                    isLoading={isFormSaving}
                    isFetching={isFormLoading}
                    onSuccess={() => loadData()}
                />
            )}

            <ArchiveWorksheetDialog
                open={isArchiveOpen}
                onOpenChange={setIsArchiveOpen}
                years={archiveYears}
                isLoading={isArchiving}
                onArchive={handleArchiveByYear}
            />

            <ArchiveSelectedWorksheetDialog
                open={isArchiveSelectedConfirmOpen}
                onOpenChange={setIsArchiveSelectedConfirmOpen}
                onConfirm={handleArchiveSelected}
                isArchiving={isArchiving}
                selectedRowsCount={selectedRowsCount}
            />

            <QrCodeDialog open={isQrOpen} onOpenChange={setIsQrOpen} request={qrRequest} canDownload />

            <DeleteWorksheetDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                target={deleteTarget}
            />

            <CloneWorksheetDialog
                open={!!cloneTarget}
                onOpenChange={() => setCloneTarget(null)}
                onConfirm={handleClone}
                isCloning={isCloning}
                target={cloneTarget}
            />
        </div>
    );
}