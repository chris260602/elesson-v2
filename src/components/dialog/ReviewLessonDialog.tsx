"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CTable } from "@/components/core/CTable";
import { ColumnDef } from "@tanstack/react-table";
import { SubLesson, LevelItem, TopicItem, WorksheetItem, Material } from "@/types/lesson-template";

interface ReviewLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: SubLesson;
  levels: LevelItem[];
  topics: TopicItem[];
  worksheets: WorksheetItem[];
  onWorksheetSelect: (id: string) => void; // Parent handles fetching worksheet materials
  onSubmit: (data: SubLesson) => void;
}

export function ReviewLessonDialog({
  open,
  onOpenChange,
  initialData,
  levels,
  topics,
  worksheets,
  onWorksheetSelect,
  onSubmit
}: ReviewLessonDialogProps) {
  const [formData, setFormData] = useState<SubLesson>(initialData);

  useEffect(() => {
    if (open) setFormData(initialData);
  }, [open, initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  const materialColumns: ColumnDef<Material>[] = [
    {
      id: "select",
      header: "Select",
      cell: ({ row }) => (
        <Checkbox 
          checked={row.original.select} 
          onCheckedChange={(checked) => {
            const newMats = [...formData.materials];
            newMats[row.index].select = !!checked;
            setFormData({ ...formData, materials: newMats });
          }} 
        />
      )
    },
    { 
        accessorKey: "link_title", header: "Link Title",
        cell: ({ row }) => (
            <Input 
                value={row.original.link_title} 
                onChange={(e) => {
                    const newMats = [...formData.materials];
                    newMats[row.index].link_title = e.target.value;
                    setFormData({ ...formData, materials: newMats });
                }}
                disabled={!row.original.select}
                className="h-8"
            />
        )
    },
    { accessorKey: "name", header: "Material Name" },
    { accessorKey: "sequence", header: "Seq" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{formData.id ? "Edit Review Lesson" : "Add Review Lesson"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Instruction</Label>
                <Textarea value={formData.instruction || ""} onChange={e => setFormData({...formData, instruction: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Level</Label>
                <Select value={formData.level_id} onValueChange={v => setFormData({...formData, level_id: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Level" /></SelectTrigger>
                    <SelectContent>{levels.map(l => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Topic</Label>
                <Select value={formData.topic_id} onValueChange={v => setFormData({...formData, topic_id: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Topic" /></SelectTrigger>
                    <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tags</Label>
                <Select value={formData.tags} onValueChange={v => setFormData({...formData, tags: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Tag" /></SelectTrigger>
                    <SelectContent>
                        {["Basic", "Core", "Enriched"].map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Worksheet</Label>
                <Select value={formData.worksheet_id} onValueChange={v => { setFormData({...formData, worksheet_id: v}); onWorksheetSelect(v); }}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Worksheet" /></SelectTrigger>
                    <SelectContent>{worksheets.map(w => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">Materials</Label>
                <div className="col-span-3 border rounded-md">
                    <CTable columns={materialColumns} data={formData.materials} enablePagination={false} />
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}