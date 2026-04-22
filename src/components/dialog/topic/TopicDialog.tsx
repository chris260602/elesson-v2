"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";


import { TopicType } from "@/types/topic";
import { LevelResponseType } from "@/apiRoutes/level";
import { showErrorMessage } from "@/utils/notificationUtils";

interface TopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: TopicType | null; // null = Create Mode, object = Edit Mode
  levels: LevelResponseType;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function TopicDialog({
  open,
  onOpenChange,
  initialData,
  levels,
  onSubmit,
  isLoading,
}: TopicDialogProps) {
  const isEditing = !!initialData;

  // Form State
  const [name, setName] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  // Reset or Populate form when dialog opens
  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");

      // Handle available_level safely:
      // 1. If it's a string "P1,P2", split it.
      // 2. If it's already an array ["P1", "P2"], use it.
      // 3. If null/undefined, empty array.
      const rawLevels = initialData?.available_level;
      if (Array.isArray(rawLevels)) {
        setSelectedLevels(rawLevels);
      } else if (typeof rawLevels === 'string' && rawLevels) {
        setSelectedLevels((rawLevels as string).split(','));
      } else {
        setSelectedLevels([]);
      }
    } else {
      // Clear state on close
      setName("");
      setSelectedLevels([]);
    }
  }, [open, initialData]);

  const handleLevelToggle = (code: string) => {
    setSelectedLevels((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code].sort()
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      showErrorMessage("Topic Name is required");
      return;
    }
    if (selectedLevels.length === 0) {
      showErrorMessage("Please select at least one level");
      return;
    }

    // Convert Array ["P1", "P2"] -> String "P1,P2" for payload
    const levelsPayload = selectedLevels.join(",");

    onSubmit({
      name,
      available_level: levelsPayload,
      // Include ID if editing
      ...(initialData?.id && { id: initialData.id })
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Topic" : "Add New Topic"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Topic Name */}
          <div className="space-y-2">
            <Label className="font-bold">Topic Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fractions"
            />
          </div>

          {/* Level Selection (Checkboxes) */}
          <div className="space-y-3">
            <Label className="font-bold">Levels</Label>
            <div className="grid grid-cols-3 gap-3 border p-3 rounded-md">
              {levels.data.map((lvl) => (
                <div key={lvl.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dialog-lvl-${lvl.id}`}
                    checked={selectedLevels.includes(lvl.code)}
                    onCheckedChange={() => handleLevelToggle(lvl.code)}
                  />
                  <Label
                    htmlFor={`dialog-lvl-${lvl.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {lvl.code}
                  </Label>
                </div>
              ))}
            </div>
            {selectedLevels.length === 0 && (
              <p className="text-xs text-red-500 font-medium">* At least one level is required</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}