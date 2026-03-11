"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Copy, QrCode, Loader2, RotateCcw, Search, CloudDownload, Plus } from "lucide-react";
import { toast } from "sonner"; 

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- CUSTOM COMPONENTS ---
import { CTable } from "@/components/core/CTable"; 
import { WorksheetDetailDialog } from "@/components/dialog/worksheet/WorksheetDetailDialog";
import { BulkCloneWorksheetDialog } from "@/components/dialog/worksheet/BulkCloneWorksheetDialog";
import { FilePreviewDialog } from "@/components/dialog/core/FilePreviewDialog";
import { QrCodeDialog } from "@/components/dialog/core/QrCodeDialog"; 
import { WorksheetFile, WorksheetItem } from "@/types/worksheet";
import { cloneWorksheet, fetchArchivedWorksheet, fetchArchivedWorksheetYears, fetchWorksheetDetail, QrRequestPayload } from "@/apiRoutes/worksheets";
import { fetchLevels } from "@/apiRoutes/level";
import { fetchTopics } from "@/apiRoutes/topic";


export default function ArchivedWorksheetsPage() {
  const [selectedYear, setSelectedYear] = useState<string>(""); 
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ levelCode: "0", topicName: "0" });
  const [worksheetData, setWorksheetData] = useState<WorksheetItem[]>([]);
  
  // Loading States
  const [isInitialLoading, setIsInitialLoading] = useState(true); 
  const [backgroundLoadingProgress, setBackgroundLoadingProgress] = useState(0); 
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isCloning, setIsCloning] = useState(false); 

  // Dialogs
  const [detailOpen, setDetailOpen] = useState(false);
  const [bulkCloneOpen, setBulkCloneOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<WorksheetFile | null>(null);
  const [cloneTarget, setCloneTarget] = useState<WorksheetItem | null>(null);
  const [qrRequest, setQrRequest] = useState<QrRequestPayload | null>(null);

  // --- QUERIES ---
  const { data: years = [], isLoading: isYearsLoading } = useQuery({ 
      queryKey: ["years"], 
      queryFn: fetchArchivedWorksheetYears 
  });

  const { data: levels = {data:[],meta:{current_page:0,last_page:0,total:0}}, isLoading: isLevelsLoading } = useQuery({ 
      queryKey: ["levels", selectedYear], 
      queryFn: () => fetchLevels(selectedYear),
      enabled: !!selectedYear 
  });

  const { data: topics = [], isLoading: isTopicsLoading } = useQuery({ 
      queryKey: ["topics", selectedYear, filters.levelCode], 
      queryFn: () => fetchTopics({year:selectedYear, level:filters.levelCode}),
      enabled: !!selectedYear 
  });

  useEffect(() => {
    if (years.length > 0 && !selectedYear) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  const handleYearChange = (year: string) => {
      setSelectedYear(year);
      setFilters(prev => ({ ...prev, levelCode: "0", topicName: "0" }));
  };

  const loadData = useCallback(async () => {
      if (!selectedYear) return;
      setIsInitialLoading(true); setWorksheetData([]); setBackgroundLoadingProgress(0); setIsBackgroundLoading(true);
      try {
        const limit = 200;
        const firstRes = await fetchArchivedWorksheet(selectedYear,limit,1);
        setWorksheetData(Array.isArray(firstRes.data) ? firstRes.data : []); 
        setIsInitialLoading(false); 

        const meta = !Array.isArray(firstRes.data) ? firstRes.meta : null;
        if (meta && meta.last_page > 1) {
           let totalFetched = 1; 
           for (let p = 2; p <= meta.last_page; p++) {
             try {
                const nextRes = await fetchArchivedWorksheet(selectedYear,limit,p);
                const nextPageData = Array.isArray(nextRes.data) ? nextRes.data : [];
                setWorksheetData((prev) => [...prev, ...nextPageData]);
                totalFetched++;
                setBackgroundLoadingProgress(Math.round((totalFetched / meta.last_page) * 100));
             } catch (err) { console.error(err); }
           }
        }
        setBackgroundLoadingProgress(100); setIsBackgroundLoading(false);
      } catch (error) { console.error(error); setIsInitialLoading(false); setIsBackgroundLoading(false); }
  }, [selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- HANDLE CLONE (NO REFRESH) ---
  const handleClone = async () => {
    if (!cloneTarget) return;
    
    setIsCloning(true);
    try {
        await cloneWorksheet(cloneTarget.id);
        // Success message ONLY - no reload
        toast.success("Worksheet cloned successfully!");
        setCloneTarget(null); 
    } catch (error: any) {
        console.error("Clone error:", error);
        toast.error(error.response?.data?.message || "Failed to clone worksheet.");
    } finally {
        setIsCloning(false);
    }
  };

  const { data: detailData = null, isLoading: isDetailLoading } = useQuery({
    queryKey: ["worksheetDetail", selectedId],
    queryFn: () => fetchWorksheetDetail(selectedId!),
    enabled: !!selectedId && detailOpen,
    staleTime: 0
  });

  const handlePreviewFile = (file: WorksheetFile) => {
    if (!selectedId) return;
    const awsUrl = process.env.NEXT_PUBLIC_AWS_URL || ""; 
    const awsEnv = process.env.NEXT_PUBLIC_AWS_ENV || ""; 
    const baseUrl = `${awsUrl}/${awsEnv}/worksheets/${selectedId}`;
    const encodedFileName = encodeURIComponent(file.name);
    
    let folderPath = "";
    if (file.type === 'pdf') folderPath = "pdf";
    else if (file.type === 'graphics') folderPath = "graphics";
    else if (file.type === 'video' || file.type === 'videos') folderPath = "videos";
    else folderPath = "latest_worksheets";

    const finalUrl = `${baseUrl}/${folderPath}/${encodedFileName}`;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || "";
    let viewerMode = 'office';
    const imageExts = ['gif', 'jpeg', 'jpg', 'png'];
    const videoExts = ['mp4', 'mov', 'm4v', 'avi', 'mpg', 'mkv'];

    if (fileExtension === 'pdf') viewerMode = 'pdf';
    else if (imageExts.includes(fileExtension)) viewerMode = 'image';
    else if (videoExts.includes(fileExtension)) viewerMode = 'video';
    
    setSelectedFile({ ...file, url: finalUrl, type: viewerMode as any });
    setPreviewOpen(true);
  };

  const filteredData = worksheetData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (item.title?.toLowerCase().includes(searchLower) || (item.levelName || "").toLowerCase().includes(searchLower));
    const matchesLevel = filters.levelCode === "0" || (item.levelName || "") === filters.levelCode;
    const matchesTopic = filters.topicName === "0" || (item.topicName || "") === filters.topicName;
    return matchesSearch && matchesLevel && matchesTopic;
  });

  const columns: ColumnDef<WorksheetItem>[] = [
    { accessorKey: "title", header: "Worksheet Title" },
    { accessorKey: "year", header: "Year" },
    { id: "level", header: "Level", accessorFn: (row) => row.levelName || "-" },
    { id: "topic", header: "Topic", accessorFn: (row) => row.topicName || "-" },
    { accessorKey: "created_by", header: "Created By" },
    { id: "options", header: "Option", cell: ({row}) => (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedId(row.original.id); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { setCloneTarget(row.original); }}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { setQrRequest({ type: 'worksheet', id: row.original.id }); setQrOpen(true); }}><QrCode className="h-4 w-4" /></Button>
        </div>
    )}
  ];

  const renderSelectContent = (isLoading: boolean, placeholder: string) => {
    if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading...</span></div>;
    return <SelectValue placeholder={placeholder} />;
  };

  return (
    <div>
      <Card className="relative overflow-hidden">
        {isBackgroundLoading && !isInitialLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-10">
                <div className="h-full bg-blue-500 transition-all duration-300 ease-in-out" style={{ width: `${backgroundLoadingProgress}%` }} />
            </div>
        )}
        <CardHeader className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Archived Worksheets</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={loadData} 
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
                            <CloudDownload className="h-3 w-3" /><span>Fetching... {backgroundLoadingProgress}%</span>
                        </div>
                    )}
                </div>
                
                <Button onClick={() => setBulkCloneOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Clone Worksheet
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-100/50 border rounded-lg items-end">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Period</Label>
                    <Select value={selectedYear} onValueChange={handleYearChange} disabled={isYearsLoading || years.length === 0}>
                        <SelectTrigger className="bg-white w-full">{renderSelectContent(isYearsLoading, "Select Year")}</SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Primary Level</Label>
                    <Select value={filters.levelCode} onValueChange={(v) => setFilters(prev => ({...prev, levelCode: v}))} disabled={isLevelsLoading}>
                        <SelectTrigger className="bg-white w-full">{renderSelectContent(isLevelsLoading, "All Levels")}</SelectTrigger>
                        <SelectContent><SelectItem value="0">All Levels</SelectItem>{levels.data.map(l => <SelectItem key={l.id} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Topic</Label>
                    <Select value={filters.topicName} onValueChange={(v) => setFilters(prev => ({ ...prev, topicName: v }))} disabled={isTopicsLoading}>
                        <SelectTrigger className="bg-white w-full">{renderSelectContent(isTopicsLoading, "All Topics")}</SelectTrigger>
                        <SelectContent><SelectItem value="0">All Topics</SelectItem>{topics.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title or level..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 pr-10" />
                     {isBackgroundLoading && !isInitialLoading && (<div className="absolute right-3 top-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>)}
            </div>
        </CardHeader>

        <CardContent>
            {isInitialLoading ? (
                <div className="h-48 flex flex-col gap-2 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Initializing worksheets...</span></div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <CTable columns={columns} data={filteredData} />
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
             <Badge variant="secondary" className="shadow-lg border gap-2 py-1.5 px-3"><Loader2 className="h-3 w-3 animate-spin" />Loading Data ({backgroundLoadingProgress}%)</Badge>
        </div>
      )}

      <WorksheetDetailDialog 
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
        data={detailData}
        isLoading={isDetailLoading}
        onPreviewFile={handlePreviewFile} 
        onViewQr={(file) => { if (!selectedId) return; setQrRequest({ type: 'file', payload: { name: file.name, type: file.type, worksheet_id: selectedId } }); setQrOpen(true); }} 
      />
      <BulkCloneWorksheetDialog open={bulkCloneOpen} onOpenChange={setBulkCloneOpen} years={years.length > 0 ? years : []} />
      <FilePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} file={selectedFile} />
      <QrCodeDialog open={qrOpen} onOpenChange={setQrOpen} request={qrRequest} />
      
      <AlertDialog open={!!cloneTarget} onOpenChange={(open) => !open && !isCloning && setCloneTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clone Worksheet?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to clone <span className="font-semibold text-foreground">{cloneTarget?.title}</span>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCloning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
                e.preventDefault(); 
                handleClone();
            }} disabled={isCloning}>
                {isCloning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Cloning...</> : "Yes, Clone it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}