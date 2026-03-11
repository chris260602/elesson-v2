"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Loader2, Calendar, Search, CloudDownload } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CTable } from "@/components/core/CTable";

// Custom Components
import { LessonPlanDialog } from "@/components/dialog/elesson/LessonPlanDialog";
import { fetchArchivedWorksheetYears } from "@/apiRoutes/worksheets";
import { fetchArchivedLesson, fetchLessonDetail } from "@/apiRoutes/template";
import { LessonType } from "@/types/template";




export default function ArchivedLessonsPage() {
  // Initialize as empty string until data loads
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // --- Data States ---
  const [archiveData, setArchiveData] = useState<LessonType[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); 
  const [backgroundLoadingProgress, setBackgroundLoadingProgress] = useState(0); 
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  // --- Dialog States ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- QUERY: YEARS ---
  const { data: years = [] } = useQuery({
    queryKey: ["archivedYears"],
    queryFn: fetchArchivedWorksheetYears,
  });

  // Effect: Set default year once fetched
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]); // Default to the first (usually latest) year
    }
  }, [years, selectedYear]);

  // --- PROGRESSIVE FETCHING LOGIC ---
  useEffect(() => {
    // Don't fetch until we have a year selected
    if (!selectedYear) return;

    let isMounted = true; 

    const fetchProgressively = async () => {
      setIsInitialLoading(true);
      setArchiveData([]);
      setBackgroundLoadingProgress(0);
      setIsBackgroundLoading(true);

      try {
        const limit = 200;
        
        const firstRes = await fetchArchivedLesson(selectedYear,limit,1);
        
        if (!isMounted) return;

        const firstPageData = firstRes.data || [];
        const meta = firstRes.meta;

        setArchiveData(firstPageData); 
        setIsInitialLoading(false); 

        if (meta && meta.last_page > 1) {
           let totalFetched = 1; 
           for (let p = 2; p <= meta.last_page; p++) {
             if (!isMounted) break;
             try {
                const nextRes = await fetchArchivedLesson(selectedYear,limit,p)
                if (isMounted) {
                    setArchiveData((prev) => [...prev, ...(nextRes.data || [])]);
                    totalFetched++;
                    const progress = Math.round((totalFetched / meta.last_page) * 100);
                    setBackgroundLoadingProgress(progress);
                }
             } catch (err) { console.error(`Failed to fetch page ${p}`, err); }
           }
        }
        
        if (isMounted) {
            setBackgroundLoadingProgress(100);
            setIsBackgroundLoading(false);
        }

      } catch (error) {
        console.error("Critical error fetching initial data", error);
        if (isMounted) { setIsInitialLoading(false); setIsBackgroundLoading(false); }
      }
    };

    fetchProgressively();

    return () => { isMounted = false; };
  }, [selectedYear]);

  // --- Query for Detail ---
  const { data: lessonDetail = null, isLoading: isDetailLoading } = useQuery({
    queryKey: ["lessonDetail", selectedId],
    queryFn: () => fetchLessonDetail(selectedId!),
    enabled: !!selectedId && isDialogOpen,
    staleTime: 0,
  });

  // --- FILTER LOGIC ---
  const filteredArchiveData = archiveData.filter((item) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    
    const titleMatch = item.title?.toLowerCase().includes(lowerQuery) ?? false;
    const termMatch = item.term?.toLowerCase().includes(lowerQuery) ?? false;
    const levelMatch = item.level_primary?.code?.toLowerCase().includes(lowerQuery) ?? false;

    return titleMatch || termMatch || levelMatch;
  });

  const handleOpenPlan = (id: string) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  const archiveColumns: ColumnDef<LessonType>[] = [
    { accessorKey: "year", header: "Year" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "term", header: "Term" },
    { accessorKey: "topical_label", header: "Topical", meta: { mobileLabel: "Topical" } },
    { accessorKey: "level_primary.code", header: "Level", meta: { mobileLabel: "Level" } },
    { 
      accessorKey: "published", 
      header: "Published",
      cell: ({ row }) => (
        <span className={row.original.published ? "text-green-600 font-medium" : "text-gray-500"}>
          {row.original.published ? "Published" : "Not Published"}
        </span>
      )
    },
    {
      id: "actions",
      header: "Option",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleOpenPlan(row.original.id)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card className="relative overflow-hidden">
        {/* Progress Bar */}
        {isBackgroundLoading && !isInitialLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-10">
                <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                    style={{ width: `${backgroundLoadingProgress}%` }}
                />
            </div>
        )}

        <CardHeader className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Calendar className="h-6 w-6 text-primary" />
                Archived E-lessons
            </CardTitle>

            {isBackgroundLoading && !isInitialLoading && (
                 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 px-3 py-1 rounded-full animate-pulse">
                    <CloudDownload className="h-3 w-3" />
                    <span>Fetching data... {backgroundLoadingProgress}%</span>
                 </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:items-end">
            <div className="w-full sm:w-[180px] space-y-2">
              <label className="text-sm font-medium leading-none">
                Period
              </label>
              
              <Select 
                value={selectedYear} 
                onValueChange={setSelectedYear} 
                disabled={years.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={years.length === 0 ? "Loading..." : "Year"} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, term, or level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10 w-full" 
              />
              
              {isBackgroundLoading && !isInitialLoading && (
                 <div className="absolute right-3 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
            {isInitialLoading ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Initializing lesson archive...</span>
                </div>
            ) : (
                <div className="animate-in fade-in duration-500 relative">
                    <CTable columns={archiveColumns} data={filteredArchiveData} />
                    
                    <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                        <div>
                            Showing {filteredArchiveData.length} records
                        </div>
                        {isBackgroundLoading && (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Loading more records...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
      {isBackgroundLoading && !isInitialLoading && (
        <div className="fixed bottom-4 right-4 z-50">
             <Badge variant="secondary" className="shadow-lg border gap-2 py-1.5 px-3">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading Data ({backgroundLoadingProgress}%)
             </Badge>
        </div>
      )}

      <LessonPlanDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          isLoading={isDetailLoading}
          data={lessonDetail} 
       />
    </div>
  );
}