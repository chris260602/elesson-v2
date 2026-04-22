"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CTable } from "@/components/core/CTable";
import { ColumnDef } from "@tanstack/react-table";
import { SubLesson } from "@/types/template";

interface MainLessonDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SubLesson | null;
  isTopical: number;
}

export function MainLessonDetailsDialog({ open, onOpenChange, data, isTopical }: MainLessonDetailsDialogProps) {
  // Sort materials by sequence
  const sortedMaterials = useMemo(() => {
    if (!data?.materials) return [];
    return [...data.materials].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [data]);

  const materialColumns: ColumnDef<any>[] = useMemo(() => [
    {
      id: "select",
      header: "Select",
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1">
          <Checkbox
            checked={!!row.original.select}
            className="pointer-events-none"
          />
        </div>
      )
    },
    {
      accessorKey: "name",
      header: "Material",
      cell: ({ row }) => <div className="font-medium text-sm min-w-[200px] max-w-[200px] whitespace-normal break-words">{row.original.name}</div>
    },
    {
      accessorKey: "instruction",
      header: "Instruction",
      cell: ({ row }) => (
        <Textarea
          readOnly
          value={row.original.instruction || ""}
          className="bg-slate-50 min-h-[80px]"
        />
      )
    },
    {
      accessorKey: "link_title",
      header: "Link Title",
      cell: ({ row }) => (
        <Input
          readOnly
          value={row.original.link_title || ""}
          className="bg-slate-50 w-40"
        />
      )
    },
    {
      accessorKey: "sequence",
      header: "Sequence",
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.sequence}
        </div>
      )
    },
  ], []);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[90vh] overflow-y-auto" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isTopical ? 'View Topical Test' : 'View Main Lesson'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Lesson Title:</Label>
            <Input readOnly value={data.title} className="col-span-3 bg-slate-50" />
          </div>

          {/* 2. Main Instruction */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-medium text-muted-foreground mt-2">Main Instruction:</Label>
            <Textarea
              readOnly
              value={data.main_instruction}
              className="col-span-3 bg-slate-50 min-h-[100px]"
            />
          </div>

          {/* 3. Passcode (Topical Only) */}
          {isTopical ? (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right font-medium text-muted-foreground mt-3">Passcode:</Label>
              <div className="col-span-3 flex items-start gap-4">
                <div className="flex items-center h-10">
                  <Checkbox
                    checked={!!data.enable_passcode}
                    className="pointer-events-none"
                  />
                </div>
                <Input
                  readOnly
                  type="number"
                  value={data.passcode || ""}
                  disabled={!data.enable_passcode}
                  className="bg-slate-50 w-32"
                />
              </div>
            </div>
          ) : undefined}

          {/* 4. Level */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Level:</Label>
            <Input readOnly value={data.level?.code} className="col-span-3 bg-slate-50" />
          </div>

          {/* 5. Term and Week (Not Topical) */}
          {!isTopical && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium text-muted-foreground">Term and Week:</Label>
              <Input readOnly value={data.term} className="col-span-3 bg-slate-50" />
            </div>
          )}

          {/* 6. Topic */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Topic:</Label>
            <Input readOnly value={data.topic?.name} className="col-span-3 bg-slate-50" />
          </div>

          {/* 7. Tags */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Tags:</Label>
            <Input readOnly value={data.tags} className="col-span-3 bg-slate-50" />
          </div>

          {/* 8. Worksheet */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Worksheet:</Label>
            <Input readOnly value={data.worksheet?.title} className="col-span-3 bg-slate-50" />
          </div>

          {/* 9. Materials Table */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-medium text-muted-foreground mt-3">Materials:</Label>
            <div className="col-span-3 border rounded-md overflow-hidden">
              <CTable columns={materialColumns} data={sortedMaterials} enablePagination={false} />
            </div>
          </div>

          {/* 10. Conclusion */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Conclusion:</Label>
            <Input readOnly value={data.conclusion} className="col-span-3 bg-slate-50" />
          </div>

          {/* 11. Homework */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Given as homework:</Label>
            <div className="col-span-3">
              <Checkbox
                checked={!!data.homework}
                className="pointer-events-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button variant="destructive" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}