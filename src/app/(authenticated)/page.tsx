"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TEMPLATES_QUERY_KEY, LESSON_QUERY_KEY } from "@/const/queryKey";
import {
  BookOpen,
  ClipboardList,
  Lock,
  PlayCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilePreviewDialog } from "@/components/dialog/core/FilePreviewDialog";
import PasscodeDialog from "@/components/dialog/PasscodeDialog";
import { WorksheetFile } from "@/types/worksheet";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";
import { fetchTemplatesList, fetchLessonDetail, verifyPasscode } from "@/apiRoutes/template";
import { TemplateItem, LessonPlan, MaterialType, SubLesson, ReviewLesson } from "@/types/template";

// --- CONSTANTS ---
const AWS_BASE_URL = process.env.NEXT_PUBLIC_AWS_URL;
const AWS_ENV_STRING = process.env.NEXT_PUBLIC_AWS_ENV;




export default function DashboardPage() {
  // Selection State
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Lesson Logic State
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [unlockedLessons, setUnlockedLessons] = useState<number[]>([]);
  const [targetLessonId, setTargetLessonId] = useState<number | null>(null);
  const [passcodeDialogOpen, setPasscodeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("main");

  // Preview State
  const [previewFile, setPreviewFile] = useState<WorksheetFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 1. Queries
  const { data: templates = [], isLoading: isTemplatesLoading } = useQuery({
    queryKey: [TEMPLATES_QUERY_KEY],
    queryFn: fetchTemplatesList
  });

  const { data: lessonData, isLoading: isLessonLoading } = useQuery({
    queryKey: [LESSON_QUERY_KEY, selectedTemplateId],
    queryFn: () => fetchLessonDetail(selectedTemplateId!),
    enabled: !!selectedTemplateId
  });

  // 2. Mutations
  const passcodeMutation = useMutation({
    mutationFn: verifyPasscode,
    onSuccess: (_, variables) => {
      showSuccessMessage("Lesson unlocked successfully");
      setPasscodeDialogOpen(false);

      // Add lesson ID to unlocked list
      setUnlockedLessons(prev => [...prev, variables.main_lesson_id]);

      // Open the accordion
      setOpenItems(prev => [...prev, String(variables.main_lesson_id)]);

      setTargetLessonId(null);
    },
    onError: (error: Error) => showErrorMessage(error.message)
  });

  // 3. Handlers
  const handleAccordionChange = (value: string[]) => {
    // Determine which item is being opened
    const newItemIdString = value.find(id => !openItems.includes(id));

    // If just closing, update state freely
    if (!newItemIdString) { setOpenItems(value); return; }

    const lessonId = parseInt(newItemIdString);
    const lesson = [...(lessonData?.main_lesson || []), ...(lessonData?.review_lesson || [])].find(l => l.id === lessonId);

    // If lesson has passcode and is NOT unlocked yet
    if (lesson && "enable_passcode" in lesson && lesson.enable_passcode === 1 && !unlockedLessons.includes(lessonId)) {
      setTargetLessonId(lessonId);
      setPasscodeDialogOpen(true);
    } else {
      setOpenItems(value);
    }
  };

  const handleMaterialClick = (material: MaterialType, worksheetId: number) => {
    // Determine folder based on material type
    let folder = "graphics";
    if (material.type === 'videos') folder = "videos";
    else if (material.type === 'pdf') folder = "pdf";

    const fullUrl = `${AWS_BASE_URL}/${AWS_ENV_STRING}/worksheets/${worksheetId}/${folder}/${material.name}`;

    // Update Preview State
    setPreviewFile({
      name: material.link_title || material.name,
      url: fullUrl,
      type: material.type
    } as WorksheetFile);
    setPreviewOpen(true);
  };

  // 4. Render Logic
  const isTopical = lessonData?.topical_label === "Yes";
  const isActiveRevision = lessonData?.active_revision_label === "Yes";
  const showReviewTab = !isTopical && !isActiveRevision;
  const selectedTemplateLabel = templates.find(t => t.id === selectedTemplateId)?.title_label;

  const renderLessonList = (lessons: SubLesson[] | ReviewLesson[]) => {
    if (!lessons || lessons.length === 0) return <div className="p-8 text-center text-muted-foreground border rounded-lg bg-white dark:bg-gray-700">No lessons available.</div>;

    return (
      <Accordion type="multiple" value={openItems} onValueChange={handleAccordionChange} className="space-y-4">
        {lessons.map((lesson, idx) => {
          const isLocked = "enable_passcode" in lesson && lesson.enable_passcode === 1 && !unlockedLessons.includes(lesson.id);

          // Tag styling matches Vue colors
          const borderColor =
            lesson.tags === 'Enriched' ? 'border-l-cyan-400' :
              lesson.tags === 'Core' ? 'border-l-emerald-500' :
                'border-l-yellow-200';

          return (
            <AccordionItem 
              key={lesson.id} 
              value={String(lesson.id)} 
              className={cn(
                "bg-white dark:bg-gray-700 border rounded-md shadow-sm border-l-[9px] transition-all",
                borderColor,
                isLocked && "opacity-75 grayscale-[0.3] bg-slate-50/50"
              )}
            >
              <AccordionTrigger className={cn(
                "px-4 hover:no-underline",
                isLocked ? "hover:bg-orange-50/30 cursor-pointer" : "hover:bg-slate-50"
              )}>
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="font-bold text-slate-500 min-w-[30px]">#{idx + 1}</div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className={cn("font-semibold", isLocked ? "text-slate-500" : "text-slate-800")}>
                        {lesson.title}
                      </span>
                      {isLocked && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 gap-1 px-1.5 py-0 h-5 text-[10px] font-bold uppercase transition-all whitespace-nowrap">
                          <Lock className="h-2.5 w-2.5" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">({lesson.tags})</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <div className="bg-blue-50 text-blue-900 p-3 rounded-md mb-3 font-medium border border-blue-100">
                  {"main_instruction" in lesson && lesson.main_instruction}
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-slate-100 ml-2">
                  {lesson.materials
                    .filter(m => m.select === 1)
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((mat) => (
                      <div key={mat.id} className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm py-2">
                        <span className="font-bold text-blue-600 min-w-[60px]">Step {mat.sequence}:</span>
                        <span className="flex-1 text-slate-700">{mat.instruction}</span>
                        <Button
                          size="sm"
                          variant={mat.type === 'videos' ? "default" : "outline"}
                          onClick={() => handleMaterialClick(mat, lesson.worksheet_id)}
                          className="min-w-[130px]"
                        >
                          {mat.type === 'videos' ? <PlayCircle className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {mat.link_title}
                        </Button>
                      </div>
                    ))}
                </div>

                {"conclusion" in lesson && lesson.conclusion && (
                  <div className="mt-4 pt-3 border-t text-sm font-semibold text-slate-700">
                    {lesson.conclusion}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black/50 p-4 md:p-8 space-y-6">

      {/* HEADER WITH SEARCHABLE COMBOBOX */}
      <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold">E-Lesson Dashboard</h1>

        <div className="w-full md:w-[450px]">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900 border-0 h-10"
                disabled={isTemplatesLoading}
              >
                {selectedTemplateId
                  ? selectedTemplateLabel
                  : (isTemplatesLoading ? "Loading templates..." : "Search for E-Lesson...")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0">
              <Command>
                <CommandInput placeholder="Search lesson name or year..." />
                <CommandList>
                  <CommandEmpty>No lesson found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {templates.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={t.title_label}
                        onSelect={() => {
                          setSelectedTemplateId(t.id);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedTemplateId === t.id ? "opacity-100" : "opacity-0")} />
                        {t.title_label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {!selectedTemplateId ? (
        <div className="flex justify-center mt-12 px-4">
          <div className="font-bold max-w-[700px] space-y-2">
            <div>
              <h2 className="text-xl underline underline-offset-4 mb-2">RESOURCES</h2>
              <p className="leading-relaxed">
                Content for the week’s lesson resource will be uploaded every Wednesday at 12 noon.
                Students can gain access to the 3 most recent weeks of content.
                To gain access to content before that, please download the Math Mavens app (available only on apple store - iPad) and scan the QR code printed on the worksheet.
              </p>
            </div>

            <div className="pt-8">
              <h2 className="text-xl underline underline-offset-4 mb-2">MM LIVE</h2>
              <p className="leading-relaxed">
                MM LIVE (Learning with Integrated Vizualizer Enhanced) Classroom is an integrated system to enhance the online learning experience of our students.
              </p>
            </div>
          </div>
        </div>
      ) : isLessonLoading || !lessonData ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-2xl">{lessonData.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-6">
              {/* SIDEBAR TABS: Changed 'h-auto' to 'h-fit' to prevent stretching */}
              <TabsList className="flex md:flex-col h-fit md:w-64 bg-white dark:bg-gray-700 p-2 rounded-lg border shadow-sm gap-2 justify-start items-stretch">
                {showReviewTab && (
                  <TabsTrigger value="review" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                    <ClipboardList className="h-4 w-4" /> Review
                  </TabsTrigger>
                )}
                <TabsTrigger value="main" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                  <BookOpen className="h-4 w-4" />
                  {isTopical ? 'Topical Test' : isActiveRevision ? 'Active Revision' : 'Main Lesson'}
                </TabsTrigger>
              </TabsList>

              {/* CONTENT PANELS */}
              <div className="flex-1">
                {showReviewTab && (
                  <TabsContent value="review" className="mt-0 space-y-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border shadow-sm mb-4"><h3 className="font-bold text-lg">Review of Previous Lesson</h3></div>
                    {renderLessonList(lessonData.review_lesson)}
                  </TabsContent>
                )}

                <TabsContent value="main" className="mt-0 space-y-4">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border shadow-sm mb-4">
                    <h3 className="font-bold text-lg">{isTopical ? 'Topical Test' : isActiveRevision ? 'Active Revision' : 'Main Lessons'}</h3>
                  </div>

                  {renderLessonList(lessonData.main_lesson)}

                  {lessonData.homework && lessonData.homework.length > 0 && (
                    <div className="mt-8 p-4 bg-orange-50 border border-orange-100 dark:bg-orange-700/5 rounded-lg">
                      <h4 className="font-bold text-orange-800 mb-2">Homework List:</h4>
                      <ol className="list-decimal list-inside text-sm text-orange-700">
                        {lessonData.homework.map((hw: any, i: number) => {
                          const rawName = hw.worksheet?.pdf?.name || "Homework File";
                          const cleanName = rawName.replace(/\.[^/.]+$/, "");
                          return (
                            <li key={i}>{cleanName}</li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* DIALOGS */}

      {/* Passcode Dialog */}
      <PasscodeDialog
        open={passcodeDialogOpen}
        onOpenChange={setPasscodeDialogOpen}
        isLoading={passcodeMutation.isPending}
        onSubmit={(code) => {
          if (targetLessonId) passcodeMutation.mutate({ main_lesson_id: targetLessonId, passcode: code });
        }}
      />

      {/* File Preview Dialog */}
      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        file={previewFile}
      />

    </div>
  );
}