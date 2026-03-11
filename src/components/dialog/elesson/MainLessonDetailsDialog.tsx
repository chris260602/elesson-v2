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

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[90vh] overflow-y-auto">
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
            ): undefined}

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
                 <Table>
                    <TableHeader className="bg-slate-100">
                        <TableRow>
                            
                            <TableHead className="w-[60px]">Select</TableHead>
                            {/* ADDED: Material Name Column */}
                            <TableHead className="min-w-[200px] max-w-[200px]">Material</TableHead> 
                            <TableHead className="min-w-[200px]">Instruction</TableHead>
                            <TableHead className="min-w-[150px]">Link Title</TableHead>
                            <TableHead className="w-[50px]">Seq</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedMaterials.length > 0 ? (
                            sortedMaterials.map((m, i) => (
                            <TableRow key={i}>
                        

                                {/* Select Checkbox */}
                                <TableCell className="align-top pt-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <Checkbox 
                                            checked={!!m.select} 
                                            className="pointer-events-none" 
                                        />
                                    </div>
                                </TableCell>

                                {/* ADDED: Material Name */}
                                <TableCell className="align-top pt-4 font-medium text-sm min-w-[200px] max-w-[200px] whitespace-normal break-words">
                                    {m.name}
                                </TableCell>

                                {/* Instruction Textarea */}
                                <TableCell>
                                    <Textarea 
                                        readOnly 
                                        value={m.instruction || ""} 
                                        className="bg-slate-50 min-h-[80px]" 
                                    />
                                </TableCell>

                                {/* Link Title Input */}
                                <TableCell className="align-top pt-2">
                                    <Input 
                                        readOnly 
                                        value={m.link_title || ""} 
                                        className="bg-slate-50 w-40" 
                                    />
                                </TableCell>
                                {/* Sequence */}
                                <TableCell className="text-center font-medium align-top pt-4">
                                    {m.sequence}
                                </TableCell>
                            </TableRow>
                        ))) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    No materials found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
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