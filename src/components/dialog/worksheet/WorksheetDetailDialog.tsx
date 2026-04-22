"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Video, Image as ImageIcon, QrCode } from "lucide-react";
import { WorksheetDetail, WorksheetFile } from "@/types/worksheet";

interface WorksheetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: WorksheetDetail | null;
  isLoading: boolean;
  onPreviewFile: (file: WorksheetFile) => void;
  onViewQr: (file: WorksheetFile) => void;
}

export function WorksheetDetailDialog({
  open,
  onOpenChange,
  data,
  isLoading,
  onPreviewFile,
  onViewQr
}: WorksheetDetailDialogProps) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  // Helper component for file rows
  const FileRow = ({ file, icon: Icon, label }: { file?: WorksheetFile, icon: any, label: string }) => {
    if (!file) return null;
    return (
      <div className="flex items-start gap-4 p-3 border rounded-lg mb-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-900 transition-colors">
        <div className="p-2 bg-white rounded-full border">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-primary cursor-pointer hover:underline" onClick={() => onPreviewFile(file)}>
              {file.name}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onViewQr(file)}>
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Uploaded at: {file.uploaded_at}</p>
          {file.description && <p className="text-xs text-slate-500 mt-1 italic">{file.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[90vh] overflow-y-auto min-h-[500px] flex flex-col" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Worksheet Details</DialogTitle>
        </DialogHeader>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p>Loading details...</p>
          </div>
        ) : !data ? (
          /* ERROR / EMPTY STATE */
          <div className="flex-1 flex items-center justify-center text-red-500">
            <p>Failed to load data.</p>
          </div>
        ) : (
          /* CONTENT STATE */
          <div className="flex gap-6 flex-1 pt-4">
            {/* Sidebar */}
            <div className="w-48 border-r pr-4 hidden sm:block space-y-2">
              <div
                className={`py-2 px-3 rounded-md cursor-pointer transition-colors ${step === 1 ? 'bg-primary/10 text-primary font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setStep(1)}
              >
                1. Form Data
              </div>
              <div
                className={`py-2 px-3 rounded-md cursor-pointer transition-colors ${step === 2 ? 'bg-primary/10 text-primary font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setStep(2)}
              >
                2. Files
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Input readOnly value={data.levelName} className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input readOnly value={data.year} className="bg-slate-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input readOnly value={data.title} className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input readOnly value={data.topicName} className="bg-slate-50" />
                  </div>
                  <div className="flex justify-end pt-8 gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={() => setStep(2)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* PDF Section */}
                  <div>
                    <Label className="mb-2 block font-semibold text-primary">Main PDF Worksheet</Label>
                    {data.pdf ? (
                      <FileRow file={data.pdf} icon={FileText} label="PDF" />
                    ) : <p className="text-sm text-slate-400 italic pl-1">No PDF uploaded.</p>}
                  </div>

                  {/* Videos */}
                  <div>
                    <Label className="mb-2 block font-semibold text-primary">Videos</Label>
                    {data.videos.length > 0 ? data.videos.map((v, i) => (
                      <FileRow key={i} file={v} icon={Video} label="Video" />
                    )) : <p className="text-sm text-slate-400 italic pl-1">No videos available.</p>}
                  </div>

                  {/* Graphics */}
                  <div>
                    <Label className="mb-2 block font-semibold text-primary">Graphics</Label>
                    {data.graphics.length > 0 ? data.graphics.map((g, i) => (
                      <FileRow key={i} file={g} icon={ImageIcon} label="Graphic" />
                    )) : <p className="text-sm text-slate-400 italic pl-1">No graphics available.</p>}
                  </div>

                  {/* Teacher Copy */}
                  <div>
                    <Label className="mb-2 block font-semibold text-primary">Teacher&apos;s Copy</Label>
                    {data.latest_worksheets.length > 0 ? data.latest_worksheets.map((t, i) => (
                      <FileRow key={i} file={t} icon={FileText} label="Teacher Copy" />
                    )) : <p className="text-sm text-slate-400 italic pl-1">No teacher copy available.</p>}
                  </div>

                  <div className="flex justify-end pt-4 gap-2 border-t mt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button variant="destructive" onClick={() => onOpenChange(false)}>Close</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}