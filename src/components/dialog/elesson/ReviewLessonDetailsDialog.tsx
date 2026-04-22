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
import { ReviewLesson, SubLesson } from "@/types/template";

interface ReviewLessonDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReviewLesson | null;
}

export function ReviewLessonDetailsDialog({ open, onOpenChange, data }: ReviewLessonDetailsDialogProps) {
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
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!row.original.select}
            className="pointer-events-none"
          />
        </div>
      )
    },
    {
      accessorKey: "link_title",
      header: "Link Title",
      cell: ({ row }) => (
        <Input
          readOnly
          value={row.original.link_title}
          className="h-8 w-40 bg-slate-50"
        />
      )
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="text-sm">{row.original.name}</span>
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
          <DialogTitle>View Review Lesson</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. Instruction */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-medium text-muted-foreground mt-2">Instruction:</Label>
            <Textarea
              readOnly
              value={data.instruction}
              className="col-span-3 bg-slate-50 min-h-[100px]"
            />
          </div>

          {/* 2. Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Title:</Label>
            <Input readOnly value={data.title} className="col-span-3 bg-slate-50" />
          </div>

          {/* 3. Level */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Level:</Label>
            <Input readOnly value={data.level?.code} className="col-span-3 bg-slate-50" />
          </div>

          {/* 4. Topic */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Topic:</Label>
            <Input readOnly value={data.topic?.name} className="col-span-3 bg-slate-50" />
          </div>

          {/* 5. Tags */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Tags:</Label>
            <Input readOnly value={data.tags} className="col-span-3 bg-slate-50" />
          </div>

          {/* 6. Worksheet */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium text-muted-foreground">Worksheet:</Label>
            <Input readOnly value={data.worksheet?.title} className="col-span-3 bg-slate-50" />
          </div>

          {/* 7. Materials Table */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-medium text-muted-foreground mt-3">Materials:</Label>
            <div className="col-span-3 border rounded-md overflow-hidden">
              <CTable columns={materialColumns} data={sortedMaterials} enablePagination={false} />
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