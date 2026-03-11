"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ArchiveWorksheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive: (year: string) => void;
  isLoading: boolean;
  years: string[];
}

export function ArchiveWorksheetDialog({ open, onOpenChange, onArchive, isLoading, years }: ArchiveWorksheetDialogProps) {
  const [year, setYear] = useState("");

  const handleArchive = () => {
    if(!year) return;
    onArchive(year);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive by Year</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label>Select Year</Label>
            <Select onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleArchive} disabled={!year || isLoading}>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}