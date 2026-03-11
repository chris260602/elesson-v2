"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X, Eye, ArrowLeft, ChevronRight } from "lucide-react";
import { CTable } from "@/components/core/CTable";
import { ColumnDef } from "@tanstack/react-table";

// Import the sub-dialogs
import { ReviewLessonDetailsDialog } from "./ReviewLessonDetailsDialog";
import { MainLessonDetailsDialog } from "./MainLessonDetailsDialog";
import { LessonPlan, ReviewLesson, SubLesson } from "@/types/template";

interface LessonPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  data: LessonPlan | null;
}

export function LessonPlanDialog({ 
  open, 
  onOpenChange, 
  isLoading,
  data
}: LessonPlanDialogProps) {
  
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState("review");

  // Sub-dialog states
  const [reviewDetailOpen, setReviewDetailOpen] = useState(false);
  const [mainDetailOpen, setMainDetailOpen] = useState(false);
  const [selectedSubLesson, setSelectedSubLesson] = useState<SubLesson | ReviewLesson | null>(null);

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
    }
  }, [open]);

  const isTopical = data?.topical as number;

  const handleOpenDetail = (item: SubLesson | ReviewLesson, type: 'review' | 'main') => {
      setSelectedSubLesson(item);
      if(type === 'review') setReviewDetailOpen(true);
      else setMainDetailOpen(true);
  }

  const listColumns = (type: "review" | "main"): ColumnDef<SubLesson | ReviewLesson>[] => [
    { accessorKey: "title", header: "Lesson Title" },
    { accessorKey: "level.code", header: "Level", meta: { mobileLabel: "Level" } },
    { accessorKey: "topic.name", header: "Topic", meta: { mobileLabel: "Topic" } },
    { accessorKey: "tags", header: "Tags", meta: { mobileLabel: "Tags" } },
    { accessorKey: "worksheet.title", header: "Worksheet", meta: { mobileLabel: "WS" } },
    {
      id: "actions",
      header: "Option",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(row.original, type)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full! w-screen! h-screen flex flex-col p-0 gap-0 border-none [&>button]:hidden">
        <DialogHeader className="p-4 bg-primary text-primary-foreground shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            {isTopical ? 'View Topical Tests Plan' : 'View E-Lesson Plan'}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data ? (
            <div className="flex flex-col md:flex-row gap-8 h-full max-w-7xl mx-auto">
              
              {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
              <div className="hidden md:block w-64 border-r pr-6 space-y-8 shrink-0">
                <div className={`relative pl-8 cursor-pointer ${currentStep === 1 ? 'opacity-100' : 'opacity-50'}`} onClick={() => setCurrentStep(1)}>
                  <div className={`absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-slate-200'}`}>1</div>
                  <h3 className="font-bold">Overview</h3>
                  <p className="text-sm text-muted-foreground">Year, Level & Term</p>
                </div>
                <div className={`relative pl-8 cursor-pointer ${currentStep === 2 ? 'opacity-100' : 'opacity-50'}`} onClick={() => setCurrentStep(2)}>
                  <div className={`absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-slate-200'}`}>2</div>
                  <h3 className="font-bold">{isTopical ? 'Tests' : 'Lessons'}</h3>
                  <p className="text-sm text-muted-foreground">Detailed Breakdown</p>
                </div>
              </div>

              {/* --- MOBILE STEPPER (Hidden on Desktop) --- */}
              <div className="md:hidden flex items-center gap-2 text-sm font-medium border-b pb-4 mb-2">
                 <span className={currentStep === 1 ? "text-primary" : "text-muted-foreground"}>Overview</span>
                 <ChevronRight className="h-4 w-4 text-muted-foreground" />
                 <span className={currentStep === 2 ? "text-primary" : "text-muted-foreground"}>{isTopical ? 'Tests' : 'Lessons'}</span>
              </div>

              {/* --- CONTENT AREA --- */}
              <div className="flex-1">
                {currentStep === 1 && (
                  <div className="space-y-6 max-w-2xl mx-auto md:mx-0 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Responsive Form Grid: Stacks on mobile, Grid on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-4 md:items-center gap-2 md:gap-4">
                      <Label className="text-left md:text-right font-bold text-muted-foreground">Year :</Label>
                      <Input readOnly value={data.year} className="md:col-span-3 bg-slate-50" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:items-center gap-2 md:gap-4">
                      <Label className="text-left md:text-right font-bold text-muted-foreground">Level :</Label>
                      <Input readOnly value={data.level} className="md:col-span-3 bg-slate-50" />
                    </div>

                    {!isTopical && (
                      <div className="grid grid-cols-1 md:grid-cols-4 md:items-center gap-2 md:gap-4">
                        <Label className="text-left md:text-right font-bold text-muted-foreground">Term :</Label>
                        <Input readOnly value={data.term} className="md:col-span-3 bg-slate-50" />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t mt-4">
                      <Button variant="destructive" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Cancel</Button>
                      <Button className="w-full sm:w-auto" onClick={() => setCurrentStep(2)}>Continue</Button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Mobile Back Button */}
                    <div className="flex items-center gap-2">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentStep(1)}
                            className="h-8 gap-1 text-muted-foreground"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Overview
                         </Button>
                    </div>

                    <Tabs defaultValue={!isTopical ? "review" : "main"} onValueChange={setActiveTab}>
                      <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
                        {!isTopical && <TabsTrigger value="review" className="flex-1 sm:flex-none">Review</TabsTrigger>}
                        <TabsTrigger value="main" className="flex-1 sm:flex-none">{isTopical ? "Topical Tests" : "Main Lesson"}</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="review" className="mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <CTable columns={listColumns("review")} data={data.review_lesson} />
                      </TabsContent>
                      
                      <TabsContent value="main" className="mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <CTable columns={listColumns("main")} data={data.main_lesson} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>

    {/* Sub Dialogs */}
    <ReviewLessonDetailsDialog 
        open={reviewDetailOpen} 
        onOpenChange={setReviewDetailOpen} 
        data={selectedSubLesson as ReviewLesson} 
    />
    <MainLessonDetailsDialog
        open={mainDetailOpen}
        onOpenChange={setMainDetailOpen}
        data={selectedSubLesson as SubLesson}
        isTopical={isTopical}
    />
    </>
  );
}