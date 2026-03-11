"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, FileText, CheckCircle2, XCircle, 
  BookOpen, ClipboardList, PlayCircle, FileSearch 
} from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { FilePreviewDialog } from "@/components/dialog/core/FilePreviewDialog"; 
import { fetchLessonDetail } from "@/apiRoutes/template"; 
import { TemplateItem } from "@/app/dashboard/e-learning/page";
import { WorksheetFile } from "@/types/worksheet";

interface PreviewLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TemplateItem | null; 
}

// --- Helper: Border Colors ---
const getTagStyle = (tags: string) => {
  if (!tags) return "";
  const t = tags.toLowerCase();
  if (t.includes("enriched")) return "border-l-[6px] border-r-[6px] border-cyan-400";
  if (t.includes("core")) return "border-l-[6px] border-r-[6px] border-emerald-500";
  if (t.includes("basic")) return "border-l-[6px] border-r-[6px] border-yellow-200"; 
  return "";
};

export function PreviewLessonDialog({
  open,
  onOpenChange,
  item,
}: PreviewLessonDialogProps) {
  
  const [previewFile, setPreviewFile] = useState<WorksheetFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: ["template-detail", item?.id],
    queryFn: () => fetchLessonDetail(item!.id),
    enabled: open && !!item?.id,
  });

  const isTopical = details?.topical === 1 || details?.topical === true || item?.topical_label === "Yes";
  const isRevision = details?.active_revision === 1 || details?.active_revision === true || item?.active_revision_label === "Yes";
  
  const mainTabLabel = isTopical ? "Topical Tests" : isRevision ? "Active Revision" : "Main Lesson";
  const showReviewTab = !isTopical && !isRevision;

  // --- UPDATED PREVIEW LOGIC ---
  const handlePreview = (worksheetId: string, material: any) => {
    const awsUrl = process.env.NEXT_PUBLIC_AWS_URL || "";
    const awsEnv = process.env.NEXT_PUBLIC_AWS_ENV || "Development";
    
    // 1. Determine Folder (Location) based on API 'type'
    let folder = "graphics"; // Default fallback
    if (material.type === "videos") folder = "videos";
    else if (material.type === "pdf") folder = "pdf";
    else if (material.type === "graphics") folder = "graphics";
    else if (material.type === "latest_worksheets") folder = "latest_worksheets";

    // 2. Determine Viewer (Render Mode) based on Extension
    const ext = material.name.split('.').pop()?.toLowerCase();
    let viewerType = "office"; // Default fallback

    if (material.type === "videos" || ['mp4', 'mov', 'avi'].includes(ext)) {
      viewerType = "video";
    } else if (ext === "pdf") {
      viewerType = "pdf";
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      viewerType = "image";
    }

    const fullUrl = `${awsUrl}/${awsEnv}/worksheets/${worksheetId}/${folder}/${material.name}`;

    setPreviewFile({
      id: material.id,
      name: material.name,
      url: fullUrl,
      type: viewerType as any
    });
    setIsPreviewOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl! h-[90vh] flex flex-col p-0 gap-0">
          
          <DialogHeader className="px-6 py-4 border-b bg-white shadow-sm z-10">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl flex items-center gap-2">
                Preview {isTopical ? 'Topical Test' : (isRevision ? 'Active Revision' : 'E-Lesson')}
                {item?.published ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-white">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <Tabs defaultValue={showReviewTab ? "review" : "main"} className="flex h-full">
                
                <div className="w-48 border-r bg-slate-50 pt-4">
                  <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1 p-2">
                    {showReviewTab && (
                      <TabsTrigger value="review" className="w-full justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200">
                        <ClipboardList className="h-4 w-4" /> Review
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="main" className="w-full justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200">
                      <BookOpen className="h-4 w-4" /> {isTopical ? 'Topical' : isRevision ? 'Revision' : 'Main'}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  
                  {/* --- REVIEW TAB --- */}
                  {showReviewTab && (
                    <TabsContent value="review" className="h-full mt-0 p-0">
                      <ScrollArea className="h-full">
                        <div className="p-6">
                          {details?.review_lesson?.length > 0 ? (
                            <div className="space-y-4">
                              <h3 className="font-bold text-lg border-b pb-2">REVIEW OF PREVIOUS LESSON</h3>
                              <p className="font-semibold text-sm text-muted-foreground ml-2">List Of Worksheets:</p>
                              <Accordion type="multiple" className="w-full space-y-2">
                                {details.review_lesson.map((item: any, index: number) => (
                                  <AccordionItem key={item.id} value={`item-${index}`} className={cn("border rounded-lg px-2", getTagStyle(item.tags))}>
                                    <AccordionTrigger className="hover:no-underline py-3">
                                      <span className="font-bold text-sm text-left">{index + 1}. {item.title} <span className="font-normal text-muted-foreground">({item.tags})</span></span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4 pt-0">
                                      {item.instruction && <p className="mb-4 text-sm text-slate-700 bg-slate-50 p-2 rounded">{item.instruction}</p>}
                                      <div className="flex flex-wrap gap-3 ml-2">
                                        {item.materials?.filter((m:any) => m.select).map((mat: any, idx: number) => (
                                          <Button key={idx} size="sm" className="gap-2" onClick={() => handlePreview(item.worksheet_id, mat)}>
                                            {mat.type === 'videos' ? <PlayCircle className="h-4 w-4" /> : <FileSearch className="h-4 w-4" />}
                                            {mat.link_title || mat.name}
                                          </Button>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          ) : (
                            <div className="flex h-40 items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">There is no review lesson.</div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}

                  {/* --- MAIN TAB --- */}
                  <TabsContent value="main" className="h-full mt-0 p-0">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        {details?.main_lesson?.length > 0 ? (
                          <div className="space-y-6">
                            <h3 className="font-bold text-lg uppercase border-b pb-2">{mainTabLabel.toUpperCase()}</h3>
                            <Accordion type="multiple" className="w-full space-y-4">
                              {details.main_lesson.map((item: any, index: number) => (
                                <AccordionItem key={item.id} value={`main-${index}`} className={cn("border rounded-lg px-2", getTagStyle(item.tags))}>
                                  <AccordionTrigger className="hover:no-underline py-3">
                                    <span className="font-bold text-sm text-left">{item.title} <span className="font-normal text-muted-foreground">({item.tags})</span></span>
                                  </AccordionTrigger>
                                  <AccordionContent className="space-y-4 pt-2">
                                    <p className="font-bold text-sm bg-blue-50 text-blue-900 p-3 rounded-md">{item.main_instruction}</p>
                                    <div className="space-y-4 ml-2">
                                      {item.materials?.filter((m:any) => m.select).map((mat: any, idx: number) => (
                                        <div key={idx} className="space-y-1">
                                          <p className="text-sm"><span className="text-blue-600 font-bold">Step {mat.sequence}</span>: {mat.instruction}</p>
                                          <Button size="sm" className="h-8" onClick={() => handlePreview(item.worksheet_id, mat)}>{mat.link_title || mat.name}</Button>
                                        </div>
                                      ))}
                                    </div>
                                    {item.conclusion && <p className="font-bold text-sm bg-slate-100 p-3 rounded mt-4 border-l-4 border-slate-400">{item.conclusion}</p>}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>

                            <div className="mt-8 pt-4 border-t">
                              <p className="font-bold mb-3">Homework List :</p>
                              {details.homework && details.homework.length > 0 ? (
                                <ul className="list-decimal list-inside space-y-2 text-sm ml-2">
                                  {details.homework.map((hw: any, idx: number) => (
                                    <li key={idx}>{hw.worksheet?.pdf?.name || hw.title}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">There is no homework.</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-40 items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">There is no {mainTabLabel.toLowerCase()}.</div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                </div>
              </Tabs>
            )}
          </div>

          <div className="p-4 border-t bg-slate-50 flex justify-end">
            <Button variant="destructive" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} file={previewFile} />
    </>
  );
}