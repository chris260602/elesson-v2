"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[90vh] overflow-y-auto">
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
                 <Table>
                    <TableHeader className="bg-slate-100">
                        <TableRow>
                            {/* ADDED: Sequence Column */}
                            <TableHead className="w-[100px]">Select</TableHead>
                            <TableHead>Link Title</TableHead>
                            <TableHead>Name</TableHead> 
                                                        <TableHead className="w-[60px]">Seq</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedMaterials.length > 0 ? (
                          sortedMaterials.map((m, i) => (
                            <TableRow key={i}>

                                {/* Select Cell */}
                                <TableCell className="align-middle">
                                  <div className="flex items-center gap-2">
                                    {/* FIX: 
                                      1. checked={!!m.select} converts 1/0 to true/false 
                                      2. pointer-events-none prevents clicking but keeps it looking "active" (black), not disabled (grey)
                                    */}
                                    <Checkbox 
                                        checked={!!m.select} 
                                        className="pointer-events-none" 
                                    />
                                  </div>
                                </TableCell>

                                {/* Link Title Input */}
                                <TableCell>
                                  <Input 
                                    readOnly 
                                    value={m.link_title} 
                                    className="h-8 w-40 bg-slate-50" 
                                  />
                                </TableCell>
                                
                                {/* Name */}
                                <TableCell className="align-middle text-sm">
                                  {m.name}
                                </TableCell>
                                {/* Sequence Cell */}
                                <TableCell className="text-center font-medium">
                                    {m.sequence}
                                </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                              No materials found.
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                 </Table>
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