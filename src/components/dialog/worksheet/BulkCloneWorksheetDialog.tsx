"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { bulkCloneArchivedWorksheet, BulkCloneArchivedWorksheetPayload, fetchArchivedWorksheetLevel } from "@/apiRoutes/worksheets";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";

interface BulkCloneWorksheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  years: string[];
}

export function BulkCloneWorksheetDialog({ open, onOpenChange, years }: BulkCloneWorksheetDialogProps) {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [availableLevels, setAvailableLevels] = useState<number[]>([]);

  // Loading states
  const [isFetchingLevels, setIsFetchingLevels] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  // Nested confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);

  // --- 1. Fetch Levels when Year Changes ---
  useEffect(() => {
    const fetchLevels = async () => {
      if (!selectedYear) {
        setAvailableLevels([]);
        setSelectedLevel(""); // Reset level if year is cleared
        return;
      }

      setIsFetchingLevels(true);
      // Reset previously selected level when year changes
      setSelectedLevel("");

      try {
        const res = await fetchArchivedWorksheetLevel(selectedYear);
        // Expecting res.data.data to be [5, 6, 1, 2, 4, 3] or similar
        const levels = res;

        // Sort levels numerically for better UX (1, 2, 3...)
        setAvailableLevels(levels.sort((a: number, b: number) => a - b));
      } catch (error) {
        console.error("Failed to fetch levels", error);
        showErrorMessage("Could not load levels for this year.");
        setAvailableLevels([]);
      } finally {
        setIsFetchingLevels(false);
      }
    };

    if (open) {
      fetchLevels();
    }
  }, [selectedYear, open]);

  // --- 2. Handle "Next" Click ---
  const handleCloneClick = () => {
    if (!selectedYear) return;
    setShowConfirm(true);
  };

  // --- 3. Execute Clone (POST API) ---
  const executeClone = async () => {
    setIsCloning(true);

    try {
      const payload: BulkCloneArchivedWorksheetPayload = {
        year: selectedYear,
        level: selectedLevel
      };
      await bulkCloneArchivedWorksheet(payload);

      showSuccessMessage("Mass Clone Worksheets Successfully");

      // Reset and Close
      setShowConfirm(false);
      onOpenChange(false);
      setSelectedYear("");
      setSelectedLevel("");
      setAvailableLevels([]);
    } catch (error: any) {
      console.error(error);
      showErrorMessage(error.response?.data?.message || "Failed to clone worksheets");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <>
      {/* --- LEVEL 1: SELECTION DIALOG --- */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Clone Worksheet By</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Show Level Select if Year is selected */}
            {selectedYear && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>Target Level (Optional)</Label>
                <Select
                  value={selectedLevel}
                  onValueChange={setSelectedLevel}
                  disabled={isFetchingLevels}
                >
                  <SelectTrigger>
                    {isFetchingLevels ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading levels...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select Level (Optional for All)" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {/* Option to clear/select 'All' explicitly if needed, or user just leaves it blank */}
                    <SelectItem value="0">All Levels</SelectItem>
                    {availableLevels.map(lvl => (
                      <SelectItem key={lvl} value={String(lvl)}>
                        Primary {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  *Leave empty or select &quot;All Levels&quot; to clone everything from {selectedYear}.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleCloneClick} disabled={!selectedYear || isFetchingLevels}>
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- LEVEL 2: CONFIRMATION ALERT --- */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to clone worksheets from <strong>{selectedYear}</strong>
              {(selectedLevel && selectedLevel !== "0")
                ? ` for Primary ${selectedLevel}`
                : ' for ALL levels'}.
              <br /><br />

            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCloning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeClone();
              }}
              disabled={isCloning}
              className="bg-primary"
            >
              {isCloning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                "Yes, Clone All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}