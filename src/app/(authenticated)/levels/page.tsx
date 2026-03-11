"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Search, Loader2, Eye } from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CTable } from "@/components/core/CTable"; 
import { LevelType } from "@/types/level";
import { fetchLevels, LevelResponseType } from "@/apiRoutes/level";



const handleFetchLevels = async (): Promise<LevelResponseType> => {
  try {
    const res = await fetchLevels();
    return res; 
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    return {data:[],meta:{current_page:0,last_page:0,total:0}};
  }
};

export default function LevelsPage() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<LevelType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- QUERY ---
  const { data: levels = {data:[],meta:{current_page:0,last_page:0,total:0}}, isLoading } = useQuery({
    queryKey: ["levels"],
    queryFn: handleFetchLevels,
  });
  console.log(levels,"INI LEVEL")
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
      cell: ({ row }) => <span className="font-medium text-slate-700">{row.getValue("code")}</span>
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
          <Eye className="h-4 w-4 text-slate-500" />
        </Button>
      )
    }
  ];

  return (
    <div>
      
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800">Level Management</CardTitle>
          </div>
          
          {/* Search Bar Moved Here */}
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
          {isLoading ? (
            <div className="h-48 flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading levels...</span>
            </div>
          ) : (
            <CTable columns={columns} data={filteredLevels} />
          )}
        </CardContent>
      </Card>

      {/* --- LEVEL DETAILS DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Level Details</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground font-semibold">Level</Label>
                <Input 
                  readOnly 
                  value={selectedItem.name} 
                  className="col-span-3 bg-slate-50" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground font-semibold">Password</Label>
                <Input 
                  readOnly 
                  value={selectedItem.password || "-"} 
                  className="col-span-3 bg-slate-50 font-mono text-sm" 
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}