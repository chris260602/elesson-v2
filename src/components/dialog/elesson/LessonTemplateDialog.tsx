"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  BookOpen,
  Layers,
  Save,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// API & Custom
import { LessonDetailDialog } from "./LessonDetailDialog";
import {
  fetchLessonDetail,
  saveSubLesson,
  deleteSubLesson,
  updateLessonSequence,
  createLessonTemplate,
  updateLessonTemplate,
  CreateLessonPlanType,
} from "@/apiRoutes/template";
import { TopicType } from "@/types/topic";
import { LevelType } from "@/types/level";
import { TermType } from "@/types/main";
import {
  LessonPlan,
  ReviewLesson,
  SubLesson,
  TemplateItem,
} from "@/types/template";
import { CTable } from "@/components/core/CTable";
import { DeleteConfirmDialog } from "@/components/core/DeleteConfirmDialog";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";

// --- SCHEMA ---
const formSchema = z.object({
  id: z.any().optional(),
  year: z.coerce.number().min(2000, "Valid year required"),
  level: z.string().min(1, "Level is required"),
  term: z.string().optional(),
  published_at: z.string().nullable().optional(),
  topical: z.boolean().default(false),
  active_revision: z.boolean().default(false),
  review_lesson: z.array(z.any()).default([]),
  main_lesson: z.array(z.any()).default([]),
});

interface LessonTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TemplateItem;
  mode: "normal" | "topical" | "revision";
  levels: LevelType[];
  topics: TopicType[];
  terms: TermType[];
  onSuccess?: () => void;
}

export function LessonTemplateDialog({
  open,
  onOpenChange,
  initialData,
  mode,
  levels,
  topics,
  terms,
  onSuccess,
}: LessonTemplateDialogProps) {
  // --- STATE ---
  const [step, setStep] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubItemSaving, setIsSubItemSaving] = useState(false);
  const [isSequenceSaving, setIsSequenceSaving] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "review" | "main";
    index: number;
    id: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState(
    mode === "normal" ? "review" : "main"
  );

  // Store the FULL data object from the API here to preserve fields not in the form
  const [fullLessonData, setFullLessonData] = useState<Partial<LessonPlan>>(
    initialData || {}
  );

  // Sub-Dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subDialogType, setSubDialogType] = useState<"review" | "main">("main");
  const [editingSubItem, setEditingSubItem] = useState<
    SubLesson | ReviewLesson
  >();

  // --- FORM ---
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      level: "",
      term: "",
      published_at: "",
      topical: false,
      active_revision: false,
      review_lesson: [],
      main_lesson: [],
    },
  });

  const { reset, getValues, setValue, watch, control } = form;

  // KEY FIX: keyName: "_id" prevents overwriting your backend "id"
  const reviewList = useFieldArray({
    control,
    name: "review_lesson",
    keyName: "_id",
  });
  const mainList = useFieldArray({
    control,
    name: "main_lesson",
    keyName: "_id",
  });

  const templateId = watch("id");
  const isStep2Accessible = !!templateId;
  const minDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (open) {
      setActiveTab(mode === "normal" ? "review" : "main");
    }
  }, [open, mode]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (open) {
      setStep(1);
      if (initialData && initialData.id) {
        setIsFetching(true);
        fetchLessonDetail(initialData.id)
          .then((apiData) => {
            setFullLessonData(apiData);
            const formattedDate = apiData.published_at
              ? apiData.published_at.split("T")[0]
              : "";

            reset({
              id: apiData.id,
              year: Number(apiData.year),
              level: String(apiData.level),
              term: apiData.term,
              published_at: formattedDate,
              topical: apiData.topical === 1,
              active_revision: apiData.active_revision === 1,
              review_lesson:
                apiData.review_lesson?.sort(
                  (a, b) => a.sequence - b.sequence
                ) || [],
              main_lesson:
                apiData.main_lesson?.sort((a, b) => a.sequence - b.sequence) ||
                [],
            });
          })
          .catch((err) => {
            console.error(err);
            showErrorMessage("Failed to fetch details");
            onOpenChange(false);
          })
          .finally(() => setIsFetching(false));
      } else {
        setFullLessonData({});
        reset({
          year: new Date().getFullYear() + 1,
          level: "",
          term: mode === "normal" ? "" : "-",
          published_at: "",
          topical: mode === "topical",
          active_revision: mode === "revision",
          review_lesson: [],
          main_lesson: [],
        });
      }
    }
  }, [open, initialData, mode, reset, onOpenChange]);

  // --- LOGIC: SAVE STEP 1 ---
  const handleStep1Submit = async () => {
    const valid = await form.trigger(["year", "level", "term", "published_at"]);
    if (!valid) {
      showErrorMessage("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      const currentValues = getValues();
      const baseData = currentValues.id ? fullLessonData : {};

      const payload = {
        ...baseData,
        ...currentValues,
        level: Number(currentValues.level),
        term:
          currentValues!.topical || currentValues!.active_revision
            ? "-"
            : currentValues!.term,
        topical: currentValues!.topical,
        active_revision: currentValues.active_revision,
      } as CreateLessonPlanType;

      let result;
      if (currentValues.id) {
        result = await updateLessonTemplate(currentValues.id, payload);
        showSuccessMessage("Template updated successfully");
      } else {
        result = await createLessonTemplate(payload);
        showSuccessMessage("New template created");
      }

      if (result) {
        setValue("id", result.id);
        setFullLessonData(result);
        onSuccess?.();
      }

      setStep(2);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to save template";
      showErrorMessage(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIC: SAVE SEQUENCE ---
  const handleSaveSequence = async () => {
    const type = activeTab as "review" | "main";
    const currentId = getValues("id");

    if (!currentId) return;

    setIsSequenceSaving(true);

    const items =
      type === "review" ? getValues("review_lesson") : getValues("main_lesson");

    if (!items || items.length === 0) {
      setIsSequenceSaving(false);
      return;
    }

    const payload = items.map((item: any, idx: number) => ({
      worksheet_id: item.worksheet_id || item.worksheet?.id || item.id,
      sequence: idx + 1,
    }));

    try {
      await updateLessonSequence(currentId, type, payload);
      showSuccessMessage(`${type === "main" ? "Main" : "Review"} sequence saved`);
    } catch (error) {
      console.error(error);
      showErrorMessage("Failed to save sequence");
    } finally {
      setIsSequenceSaving(false);
    }
  };

  // --- LOGIC: DELETE PREPARATION ---
  const initiateDelete = (
    type: "review" | "main",
    index: number,
    id: number
  ) => {
    setItemToDelete({ type, index, id });
    setDeleteDialogOpen(true);
  };

  // --- LOGIC: EXECUTE DELETE ---
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const { type, index, id } = itemToDelete;

    try {
      await deleteSubLesson(type, id);

      const listHandler = type === "review" ? reviewList : mainList;
      listHandler.remove(index);

      showSuccessMessage(`${type === "main" ? "Main" : "Review"} lesson deleted`);
      setDeleteDialogOpen(false); // Close dialog on success
    } catch (e) {
      console.error(e);
      showErrorMessage("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // --- LOGIC: SUB-ITEM MODAL ---
  const openSubDialog = (
    type: "review" | "main",
    item?: SubLesson | ReviewLesson
  ) => {
    setSubDialogType(type);
    setEditingSubItem(item || undefined);
    setSubDialogOpen(true);
  };

  const handleSaveSubItem = async (itemData: SubLesson | ReviewLesson) => {
    setIsSubItemSaving(true);
    const currentId = getValues("id");
    if (!currentId) {
      showErrorMessage("ID missing");
      return;
    }

    const payload = {
      ...itemData,
      template_id: currentId,
      level_id: getValues("level"),
      materials: itemData.materials.filter((m) => m.select),
    };

    try {
      const savedItem = await saveSubLesson(subDialogType, payload);
      const listHandler = subDialogType === "review" ? reviewList : mainList;

      if (editingSubItem && editingSubItem.id) {
        const idx = listHandler.fields.findIndex(
          (i: any) => i.id === editingSubItem.id
        );
        if (idx !== -1) listHandler.update(idx, savedItem);
      } else {
        listHandler.append(savedItem);
      }
      showSuccessMessage("Saved successfully");
      setSubDialogOpen(false);
    } catch (error: any) {
      showErrorMessage("Failed to save lesson item");
    } finally {
      setIsSubItemSaving(false);
    }
  };

  // --- LOGIC: REORDER ---
  const handleMove = (
    type: "review" | "main",
    index: number,
    direction: -1 | 1
  ) => {
    const listHandler = type === "review" ? reviewList : mainList;
    const items = listHandler.fields;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    listHandler.move(index, newIndex);
  };

  // --- RENDER TABLE ---
  const renderTable = (type: "review" | "main") => {
    const fields = type === "review" ? reviewList.fields : mainList.fields;
    const showTerm = type === "main" && mode === "normal";

    const columns: ColumnDef<SubLesson | ReviewLesson>[] = [
      {
        id: "sequence",
        header: "Sequence",
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={row.index === 0}
              onClick={() => handleMove(type, row.index, -1)}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={row.index === fields.length - 1}
              onClick={() => handleMove(type, row.index, 1)}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "level",
        header: "Level",
        cell: ({ row }) =>
          // @ts-ignore
          row.original.level?.code || row.original.level_id || "-",
      },
      ...(showTerm
        ? [
          {
            id: "term",
            header: "Term",
            cell: ({ row }: any) => (
              <Badge variant="outline" className="bg-blue-50 dark:bg-gray-800">
                {row.original.term || "-"}
              </Badge>
            ),
          },
        ]
        : []),
      {
        id: "topic",
        header: "Topic",
        cell: ({ row }) =>
          // @ts-ignore
          row.original.topic?.name || "-",
      },
      {
        id: "tags",
        header: "Tags",
        cell: ({ row }) =>
          row.original.tags ? (
            <Badge variant="secondary">{row.original.tags}</Badge>
          ) : (
            "-"
          ),
      },
      {
        id: "worksheet",
        header: "Worksheet",
        cell: ({ row }) =>
          // @ts-ignore
          row.original.worksheet?.title || "-",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Options</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openSubDialog(type, row.original)}
            >
              <Pencil className="h-3 w-3 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => initiateDelete(type, row.index, row.original.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <CTable
          data={fields}
          columns={columns}
          // Use _id (UUID) for stable row rendering to avoid conflicts with backend id
          getRowId={(row: any) => row._id}
          enablePagination={false}
          enableSorting={false}
        />
      </div>
    );
  };

  const mainTabLabel =
    mode === "topical"
      ? "Topical Test"
      : mode === "revision"
        ? "Active Revision"
        : "E-Lesson";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full! w-screen! h-screen flex flex-col p-0 gap-0" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              {initialData
                ? `Edit ${initialData.title}`
                : `Create ${mainTabLabel}`}
            </DialogTitle>
          </DialogHeader>

          {isFetching ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              {/* SIDEBAR */}
              <div className="w-64 border-r bg-slate-50/50 dark:bg-slate-700/50 p-4 space-y-2 hidden sm:block">
                <div
                  onClick={() => setStep(1)}
                  className={`px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors border ${step === 1
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "border-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  1. Configuration
                </div>
                <div
                  onClick={() => {
                    if (isStep2Accessible) setStep(2);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between border ${step === 2
                    ? "bg-primary/10 text-primary border-primary/20"
                    : isStep2Accessible
                      ? "border-transparent text-slate-600 hover:bg-slate-100 cursor-pointer"
                      : "border-transparent text-slate-300 cursor-not-allowed"
                    }`}
                >
                  <span>2. Lessons</span>
                  {!isStep2Accessible && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-1 bg-slate-100"
                    >
                      Locked
                    </Badge>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto p-6">
                <Form {...form}>
                  {step === 1 && (
                    <div className="space-y-6 max-w-md mx-auto mt-4 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-4">
                        <FormField
                          control={control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Year <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div
                          className={`grid gap-4 ${mode === "normal" ? "grid-cols-2" : "grid-cols-1"
                            }`}
                        >
                          <FormField
                            control={control}
                            name="level"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Level <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isStep2Accessible}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {levels.map((l) => (
                                      <SelectItem
                                        key={l.id}
                                        value={String(l.id)}
                                      >
                                        {l.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {mode === "normal" && (
                            <FormField
                              control={control}
                              name="term"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Term <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isStep2Accessible}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Term" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {terms.map((t, idx: number) => (
                                        <SelectItem
                                          key={idx}
                                          value={t.display_val}
                                        >
                                          {t.display_val}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        <FormField
                          control={control}
                          name="published_at"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Publish Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  min={minDate}
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="h-full flex flex-col animate-in fade-in">
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex-1 flex flex-col"
                      >
                        <div className="flex justify-between items-center mb-4 px-1">
                          <TabsList className="grid w-auto grid-cols-2">
                            {mode === "normal" && (
                              <TabsTrigger
                                value="review"
                                className="gap-2 px-6"
                              >
                                <Layers className="h-4 w-4" /> Review
                              </TabsTrigger>
                            )}
                            <TabsTrigger value="main" className="gap-2 px-6">
                              <BookOpen className="h-4 w-4" /> {mainTabLabel}
                            </TabsTrigger>
                          </TabsList>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600 text-green-700 hover:bg-green-50 min-w-[130px]"
                              onClick={handleSaveSequence}
                              disabled={
                                isSequenceSaving ||
                                (activeTab === "review"
                                  ? reviewList.fields.length
                                  : mainList.fields.length) === 0
                              }
                            >
                              {isSequenceSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save Sequence
                            </Button>

                            <Button
                              size="sm"
                              onClick={() =>
                                openSubDialog(activeTab as "review" | "main")
                              }
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add{" "}
                              {activeTab === "review" ? "Review" : mainTabLabel}
                            </Button>
                          </div>
                        </div>

                        {mode === "normal" && (
                          <TabsContent
                            value="review"
                            className="flex-1 mt-0 h-full flex flex-col"
                          >
                            {renderTable("review")}
                          </TabsContent>
                        )}
                        <TabsContent
                          value="main"
                          className="flex-1 mt-0 h-full flex flex-col"
                        >
                          {renderTable("main")}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </Form>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t">
            {step === 1 ? (
              <div className="flex justify-between w-full">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStep1Submit} disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue
                </Button>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back to Config
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onOpenChange(false)}
                >
                  Done & Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUB-ITEM EDIT DIALOG */}
      {subDialogOpen && (
        <LessonDetailDialog
          open={subDialogOpen}
          onOpenChange={setSubDialogOpen}
          type={subDialogType}
          mode={mode}
          initialData={editingSubItem}
          levelId={watch("level")}
          levels={levels}
          topics={topics}
          onSave={handleSaveSubItem}
          terms={terms}
          isLoading={isSubItemSaving}
        />
      )}

      {/* CONFIRM DELETE DIALOG */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}