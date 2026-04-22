"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CLASSES_QUERY_KEY } from "@/const/queryKey";
import { invalidateClasses } from "@/utils/tanStackUtils";
import { ColumnDef } from "@tanstack/react-table";
import {
  Loader2,
  RotateCcw,
  Search,
  CloudDownload
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- CUSTOM COMPONENTS ---
import { CTable } from "@/components/core/CTable";
import { ClassType } from "@/types/class";
import { fetchClasses, updateClassTag } from "@/apiRoutes/class";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";

// --- CONSTANTS ---
const TAG_OPTIONS = [
  { code: "SG", name: "Small Group", color: "bg-blue-100 text-blue-700" },
  { code: "R", name: "Regular", color: "bg-slate-100 text-slate-700" },
  { code: "F", name: "Fast", color: "bg-orange-100 text-orange-700" },
];

// --- SUB-COMPONENT: TAG CELL ---
const TagCell = ({ item }: { item: ClassType }) => {
  const queryClient = useQueryClient();
  const [currentTag, setCurrentTag] = useState(item.tags);

  // Sync local state if the background data changes
  useEffect(() => {
    setCurrentTag(item.tags);
  }, [item.tags]);

  const mutation = useMutation({
    mutationFn: updateClassTag,
    onMutate: (variables) => {
      setCurrentTag(variables.tag); // Optimistic Update
    },
    onSuccess: (data, variables) => {
      const tagName = TAG_OPTIONS.find(t => t.code === variables.tag)?.name;
      showSuccessMessage(`Tag updated to ${tagName}`);
      invalidateClasses(queryClient);
    },
    onError: () => {
      showErrorMessage("Failed to update tag");
      setCurrentTag(item.tags); // Revert on error
    }
  });

  return (
    <div className="w-[140px]">
      <Select
        value={currentTag}
        onValueChange={(val) => mutation.mutate({ id: item.id, tag: val })}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="h-8 bg-white/50">
          <SelectValue placeholder="Select Tag" />
        </SelectTrigger>
        <SelectContent>
          {TAG_OPTIONS.map((tag) => (
            <SelectItem key={tag.code} value={tag.code}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${tag.code === "SG" ? "bg-blue-500" : tag.code === "F" ? "bg-orange-500" : "bg-slate-500"}`} />
                {tag.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ClassesPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ tag: "ALL" });

  // Queries
  const {
    data: classes = [],
    isLoading,
    isFetching,
    isRefetching,
    refetch
  } = useQuery({
    queryKey: [CLASSES_QUERY_KEY],
    queryFn: fetchClasses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filtering Logic
  const filteredData = useMemo(() => {
    return classes.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      // Search Match
      const matchesSearch = item.class_id?.toLowerCase().includes(searchLower);
      // Filter Match
      const matchesTag = filters.tag === "ALL" || item.tags === filters.tag;

      return matchesSearch && matchesTag;
    });
  }, [classes, searchQuery, filters]);

  const renderSelectContent = (loadingState: boolean, placeholder: string) => {
    if (loadingState) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading...</span></div>;
    return <SelectValue placeholder={placeholder} />;
  };

  // Columns Configuration
  const columns: ColumnDef<ClassType>[] = [
    {
      accessorKey: "class_id",
      header: "Class Name",
      cell: ({ row }) => <span className="font-semibold ">{row.getValue("class_id")}</span>
    },
    {
      accessorKey: "tags",
      header: "Class Tag",
      cell: ({ row }) => <TagCell item={row.original} />
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const tag = TAG_OPTIONS.find(t => t.code === row.original.tags);
        return (
          <Badge variant="outline" className={`${tag?.color || "bg-gray-100"} border-0`}>
            {tag?.name || "Unknown"}
          </Badge>
        );
      }
    }
  ];

  return (
    <div>
      <Card className="relative overflow-hidden border-slate-200 shadow-sm">
        {/* Loading Indicator Bar */}
        {(isLoading || isFetching) && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 z-10">
            <div className="h-full bg-primary/60 animate-progress origin-left" />
          </div>
        )}

        <CardHeader className="space-y-6 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">Classes Management</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => refetch()}
                      disabled={isLoading || isFetching}
                    >
                      <RotateCcw className={`h-4 w-4 ${isLoading || isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Refresh List</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isRefetching && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 px-3 py-1 rounded-full animate-pulse ml-2">
                  <CloudDownload className="h-3 w-3" /><span>Syncing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters Area */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-100/50 dark:bg-gray-700/50 border rounded-lg items-end">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Tag</Label>
              <Select
                value={filters.tag}
                onValueChange={(v) => setFilters(prev => ({ ...prev, tag: v }))}
              >
                <SelectTrigger className="bg-white w-full border-slate-200">
                  {renderSelectContent(isLoading || isFetching, "All Tags")}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tags</SelectItem>
                  {TAG_OPTIONS.map(opt => (
                    <SelectItem key={opt.code} value={opt.code}>{opt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Spacer for layout balance */}
            <div className="hidden md:block md:col-span-3"></div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Class Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 pr-10 bg-white border-slate-200 focus-visible:ring-offset-0"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading || isFetching ? (
            <div className="h-48 flex flex-col gap-2 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              <span className="text-sm text-muted-foreground">Loading classes...</span>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <CTable columns={columns} data={filteredData} />
              <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                <div>Showing {filteredData.length} records</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}