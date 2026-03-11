"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  FileStack,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// --- UI COMPONENTS ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";

// --- API ---
import { fetchWorksheetsByTopicAndLevel } from "@/apiRoutes/worksheets";
import { TopicType } from "@/types/topic";
import { LevelType } from "@/types/level";
import { ReviewLesson, SubLesson } from "@/types/template";
import { TermType } from "@/types/main";

// --- CONSTANTS ---
const DEFAULT_MAIN_INSTRUCTION =
  "This worksheet is part of the teaching and learning lesson pack for this week. Attempt the questions that are discussed in class (watch the lesson video / questions video walkthroughs or answer key provided) and complete the rest of the worksheet as homework (if any).";
const DEFAULT_REVIEW_INSTRUCTION =
  "Click on the link below to view the solution(s) to the worksheet and use it to complete your correction(s).";

const CONCLUSION_OPTIONS = [
  "This worksheet is for self-assessment and review. Submission to your teacher is not required.",
  "This worksheet is completed in class and not part of homework. Submit to your teacher once all homework is completed.",
  "The rest of this worksheet is to be completed as homework. Submit to your teacher once all homework is completed.",
  "This worksheet is to be completed fully in one sitting as homework. Submit to your teacher once all homework is completed.",
];

// --- SCHEMA ---
const detailSchema = z.object({
  id: z.any().optional(),
  title: z.string().min(1, "Title is required"),
  instruction: z.string().min(1, "Instruction is required"),
  level_id: z.string().min(1, "Level is required"),
  topic_id: z.string().min(1, "Topic is required"),
  tags: z.string().min(1, "Tag is required"),
  worksheet_id: z.string().min(1, "Worksheet is required"),

  // Main Lesson Specifics
  term: z.string().optional(),
  conclusion: z.string().optional(),
  homework: z.boolean().default(false),

  // Topical / Revision Specifics
  enable_passcode: z.boolean().default(false),
  passcode: z.string().optional(),

  // Materials List
  materials: z.array(
    z.object({
      id: z.any(),
      name: z.string(),
      instruction: z.string().nullable().optional(),
      link_title: z.string().nullable().optional(),
      sequence: z.number(),
      select: z.boolean().default(false),
    }),
  ),
});

type DetailFormValues = z.infer<typeof detailSchema>;

interface LessonDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "review" | "main";
  mode: "normal" | "topical" | "revision";
  initialData?: SubLesson | ReviewLesson;
  levelId: string;
  levels: LevelType[];
  topics: TopicType[];
  terms?: TermType[];
  onSave: (data: any) => void;
}

export function LessonDetailDialog({
  open,
  onOpenChange,
  type,
  mode,
  initialData,
  levelId,
  levels,
  topics,
  terms = [],
  onSave,
}: LessonDetailDialogProps) {
  // --- HELPERS ---
  const isMain = type === "main";
  const isReview = type === "review";
  const isNormalMode = mode === "normal";

  const getDefaultInstruction = () => {
    return isReview ? DEFAULT_REVIEW_INSTRUCTION : DEFAULT_MAIN_INSTRUCTION;
  };

  const getDialogTitle = () => {
    if (initialData) {
      if (mode === "topical") return "Edit Topical Test";
      if (mode === "normal") return "Edit Main Lesson";
      if (mode === "revision") return "Edit Active Revision Class";
      if (isReview) return "Edit Review Lesson";
    }
    if (isReview) return "Add Review Lesson";
    if (mode === "topical") return "Add Topical Test";
    if (mode === "revision") return "Add Active Revision";
    return "Add Main Lesson";
  };

  // --- STATE ---
  const [loadedWorksheetId, setLoadedWorksheetId] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(detailSchema),
    defaultValues: {
      title: "",
      instruction: getDefaultInstruction(),
      level_id: levelId || "",
      tags: "",
      topic_id: "",
      worksheet_id: "",
      term: "",
      materials: [],
      conclusion: "",
      homework: false,
      enable_passcode: false,
      passcode: "",
    },
  });

  const { control, watch, reset, setError } = form;
  const { fields, replace, move } = useFieldArray({
    control,
    name: "materials",
    keyName: "_id"
  });

  const selectedLevel = watch("level_id");
  const selectedTopic = watch("topic_id");
  const selectedWorksheet = watch("worksheet_id");

  // --- QUERIES ---
  const { data: worksheets = [], isFetching: isFetchingWS } = useQuery({
    queryKey: ["worksheets", selectedLevel, selectedTopic],
    queryFn: () =>
      fetchWorksheetsByTopicAndLevel({
        levelId: Number(selectedLevel),
        topicId: Number(selectedTopic),
      }),
    enabled: Boolean(selectedLevel) && Boolean(selectedTopic),
  });

  // --- EFFECT 1: Initial Load (Metadata Only) ---
  useEffect(() => {
    if (open) {
      // Always reset the tracker so Effect 2 runs to populate materials
      setLoadedWorksheetId(""); 

      if (initialData) {
        const isSubLessonType = "passcode" in initialData;
        
        // Populate the form METADATA only. 
        // We purposefully leave materials as [] or don't set them here,
        // so that the logic in Effect 2 handles the full merge.
        reset({
          id: initialData.id,
          title: initialData.title,
          instruction: !isSubLessonType
            ? initialData.instruction
            : initialData.main_instruction,
          level_id: String(
            initialData.level_id || initialData.level?.id || levelId,
          ),
          tags: initialData.tags,
          topic_id: String(initialData.topic_id || initialData.topic?.id || ""),
          worksheet_id: String(
            initialData.worksheet_id || initialData.worksheet?.id || "",
          ),
          term: isSubLessonType ? initialData.term || "" : "",
          conclusion: isSubLessonType ? initialData.conclusion || "" : "",
          homework: isSubLessonType ? Boolean(initialData.homework) : undefined,
          enable_passcode: isSubLessonType
            ? Boolean(initialData?.enable_passcode)
            : undefined,
          passcode: (isSubLessonType && initialData.passcode) ? String(initialData.passcode) || "" : "",
          materials: [], // Let the second effect populate this
        });
      } else {
        // Create Mode
        reset({
          title: "",
          instruction: getDefaultInstruction(),
          level_id: levelId || "",
          tags: "",
          topic_id: "",
          worksheet_id: "",
          term: "",
          materials: [],
          conclusion: "",
          homework: false,
          enable_passcode: false,
          passcode: "",
        });
      }
    }
  }, [open, initialData, reset, type, mode, levelId]);

  // --- EFFECT 2: Populate Materials (Load & Merge) ---
  useEffect(() => {
    // Run if:
    // 1. A worksheet is selected in the form
    // 2. We haven't loaded this worksheet ID yet (or we were forced to reset by Effect 1)
    // 3. The API data (worksheets) is actually available
    if (
      selectedWorksheet &&
      selectedWorksheet !== loadedWorksheetId &&
      worksheets.length > 0
    ) {
      const ws = worksheets.find(
        (w) => String(w.id) === String(selectedWorksheet),
      );

      if (ws && ws.materials) {
        let mergedMaterials = [];

        // Check if we are in "Edit Mode" for THIS specific worksheet
        // (i.e., The user saved this lesson with this worksheet ID previously)
        const isEditingSameWorksheet = initialData && String(initialData.worksheet_id || initialData.worksheet?.id) === String(selectedWorksheet);

        if (isEditingSameWorksheet) {
           // --- MERGE LOGIC ---
           // 1. Get ALL materials from the API (Backend Source of Truth)
           const backendMaterials = ws.materials || [];
           // 2. Get SAVED materials from initialData (User's Saved Values)
           const savedMaterials = initialData.materials || [];

           mergedMaterials = backendMaterials.map(bm => {
              // Find if this backend material was previously saved
              const savedItem = savedMaterials.find(sm => sm.id === bm.id);

              if (savedItem) {
                 // If saved, use the saved overrides and mark as selected
                 return {
                    ...bm, 
                    ...savedItem, // Overwrite with saved instruction/link_title
                    select: true,
                    sequence: savedItem.sequence || bm.sequence
                 };
              }
              
              // If not saved, return the default backend item, unselected
              return {
                 id: bm.id,
                 name: bm.name,
                 instruction: bm.instruction || "",
                 link_title: bm.link_title || "",
                 sequence: bm.sequence || 0,
                 select: false
              };
           });

           // Sort: We usually want saved items respecting their saved sequence, 
           // but often it's easier to just sort by the default sequence or id if the UI doesn't allow drag-drop reordering of mixed items easily.
           // Here we sort by sequence to keep it tidy.
           mergedMaterials.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        } else {
          // --- FRESH LOAD LOGIC ---
          // Just load the backend materials as is, unselected
          const sortedMaterials = [...ws.materials].sort(
            (a, b) => (a.sequence || 0) - (b.sequence || 0),
          );
          mergedMaterials = sortedMaterials.map((m) => ({
            id: m.id,
            name: m.name,
            instruction: m.instruction || "",
            link_title: m.link_title || "",
            sequence: m.sequence || 0,
            select: false,
          }));
        }

        replace(mergedMaterials);
        setLoadedWorksheetId(selectedWorksheet);
      }
    }
  }, [selectedWorksheet, loadedWorksheetId, worksheets, replace, initialData]);

  // --- HANDLER ---
  const handleSubmit = (data: DetailFormValues) => {
    // Validate Term manually if mode is Normal Main Lesson
    if (isMain && isNormalMode && !data.term) {
      setError("term", { message: "Term is required" });
      return;
    }

    // Validate Passcode if enabled
    if (isMain && !isNormalMode && data.enable_passcode) {
      if (!data.passcode || data.passcode.length < 4) {
        setError("passcode", { message: "Passcode must be at least 4 chars" });
        return;
      }
    }
    const selectedWorksheet = worksheets.find(
      (worksheet) => worksheet.id === Number(data.worksheet_id),
    );
    
    // Filter to only send SELECTED materials
    const selectedMaterials = data.materials.filter(m => m.select);

    const sequencedMaterials = selectedMaterials.map((item, index) => {
      const originalItem =
        selectedWorksheet?.materials?.find(
          (backendItem) => backendItem.id === item.id,
        ) || {};
      return { ...originalItem, ...item, sequence: index + 1 };
    });

    const { instruction, ...restOfData } = data;
    const payload = {
      ...restOfData,
      materials: sequencedMaterials,
      [isReview ? "instruction" : "main_instruction"]: instruction,
      term: isMain && isNormalMode ? data.term : "-",
      enable_passcode: Number(data.enable_passcode)
    };

    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <Form {...form}>
            <form
              id="lesson-detail-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {/* --- SECTION 1: DETAILS --- */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tags <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Tag" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Core">Core</SelectItem>
                            <SelectItem value="Enriched">Enriched</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="instruction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isMain ? "Main Instruction" : "Instruction"}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Term & Week (Only for Normal Main Lessons) */}
                {isMain && isNormalMode && (
                  <div className="grid grid-cols-1">
                    <FormField
                      control={control}
                      name="term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Term & Week <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Term" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {terms.map((t, idx: number) => (
                                <SelectItem key={idx} value={t.display_val}>
                                  {t.display_val}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Passcode (Only for Topical / Revision) */}
                {isMain && !isNormalMode && (
                  <div className="flex items-end gap-4 bg-yellow-50/50 p-4 border rounded-md">
                    <FormField
                      control={control}
                      name="enable_passcode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Enable Passcode
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="passcode"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter Passcode (Numeric)"
                              disabled={!watch("enable_passcode")}
                              className="h-9"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="level_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Level <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {levels.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)}>
                                {l.code || l.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="topic_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Topic <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topics.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="worksheet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Worksheet <span className="text-red-500">*</span>{" "}
                        {isFetchingWS && (
                          <Loader2 className="inline h-3 w-3 animate-spin ml-2" />
                        )}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedTopic || !selectedLevel}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Worksheet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {worksheets.map((w) => (
                            <SelectItem key={w.id} value={String(w.id)}>
                              {w.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* --- SECTION 2: MATERIALS --- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileStack className="h-4 w-4 text-slate-500" />
                    <h3 className="font-medium text-sm text-slate-900">
                      Materials Configuration
                    </h3>
                  </div>
                  {fields.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {fields.length} available
                    </span>
                  )}
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[50px]">Use</TableHead>
                        <TableHead className="w-[80px] text-center">
                          Seq
                        </TableHead>
                        <TableHead>Material Name</TableHead>
                        {isMain && <TableHead>Override Instruction</TableHead>}
                        <TableHead>Link Title</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow
                          key={field.id}
                          data-state={
                            watch(`materials.${index}.select`) ? "selected" : ""
                          }
                        >
                          <TableCell>
                            <FormField
                              control={control}
                              name={`materials.${index}.select`}
                              render={({ field: cb }) => (
                                <Checkbox
                                  checked={cb.value}
                                  onCheckedChange={cb.onChange}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === 0}
                                onClick={() => move(index, index - 1)}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === fields.length - 1}
                                onClick={() => move(index, index + 1)}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell
                            className="text-xs font-medium max-w-[200px] truncate"
                            title={field.name}
                          >
                            {field.name}
                          </TableCell>

                          {isMain && (
                            <TableCell>
                              <FormField
                                control={control}
                                name={`materials.${index}.instruction`}
                                render={({ field: txt }) => (
                                  <Textarea
                                    {...txt}
                                    className="h-9 text-xs min-h-[36px] resize-none"
                                    disabled={
                                      !watch(`materials.${index}.select`)
                                    }
                                    placeholder="Override default instruction"
                                  />
                                )}
                              />
                            </TableCell>
                          )}

                          <TableCell>
                            <FormField
                              control={control}
                              name={`materials.${index}.link_title`}
                              render={({ field: txt }) => (
                                <Input
                                  {...txt}
                                  className="h-8 text-xs"
                                  disabled={!watch(`materials.${index}.select`)}
                                  placeholder="Link display text"
                                />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={isMain ? 5 : 4}
                            className="h-24 text-center"
                          >
                            {watch("worksheet_id") ? (
                              <div className="flex items-center justify-center gap-2 text-yellow-600">
                                <AlertCircle className="h-4 w-4" /> 
                                {isFetchingWS ? "Loading materials..." : "No materials found in this worksheet."}
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                Select a worksheet above to view materials.
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* --- SECTION 3: CONCLUSION & HOMEWORK --- */}
              {isMain && (
                <div className="grid grid-cols-1 gap-4 border p-4 rounded-md bg-slate-50 mt-4">
                  <FormField
                    control={control}
                    name="conclusion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conclusion</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Conclusion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONCLUSION_OPTIONS.map((option, idx) => (
                              <SelectItem
                                key={idx}
                                value={option}
                                className="text-xs"
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <FormField
                      control={control}
                      name="homework"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Given as Homework?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
          >
            Save Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}