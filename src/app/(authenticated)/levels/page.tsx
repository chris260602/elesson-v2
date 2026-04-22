"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LEVELS_QUERY_KEY } from "@/const/queryKey";
import { ColumnDef } from "@tanstack/react-table";
import { Search, Loader2, Eye } from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CTable } from "@/components/core/CTable"; 
import { LevelType } from "@/types/level";
import { fetchLevels, LevelResponseType } from "@/apiRoutes/level";
import { LevelDetailsDialog } from "@/components/dialog/level/LevelDetailsDialog";


const handleFetchLevels = async (): Promise<LevelResponseType> => {
  try {
    const res = await fetchLevels();
    return res; 
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    return { data: [], meta: { current_page: 0, last_page: 0, total: 0 } };
  }
};

export default function LevelsPage() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<LevelType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- QUERY ---
  const { 
    data: levels = { data: [], meta: { current_page: 0, last_page: 0, total: 0 } }, 
    isLoading,
    isFetching
  } = useQuery({
    queryKey: [LEVELS_QUERY_KEY], 
    queryFn: handleFetchLevels,
  });
  
  // --- FILTERING ---
  const filteredLevels = levels.data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- HANDLERS ---
  const handleOpenDialog = (item: LevelType) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  // --- COLUMNS ---
  const columns: ColumnDef<LevelType>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-medium">{row.getValue("code")}</span>
    },
    {
      accessorKey: "name",
      header: "Level",
    },
    {
      id: "option",
      header: "Option",
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleOpenDialog(row.original)}
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Level Management</CardTitle>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading || isFetching ? (
            <div className="h-48 flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading levels...</span>
            </div>
          ) : (
            <CTable columns={columns} data={filteredLevels} />
          )}
        </CardContent>
      </Card>

      <LevelDetailsDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        level={selectedItem} 
      />
    </div>
  );
}