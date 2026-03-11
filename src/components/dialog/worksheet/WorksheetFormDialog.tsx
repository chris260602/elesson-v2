"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Upload,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import the FilePreviewDialog we created earlier
import { FilePreviewDialog } from "@/components/dialog/core/FilePreviewDialog";
import { FileUploader } from "@/components/core/FileUploader";
import { WorksheetDetail, MediaItem, WorksheetFile } from "@/types/worksheet";
import {
  deleteFile,
  doesFileExist,
  getPresignedUploadUrl,
} from "@/app/actions/s3";
import { checkWorksheetMedia, UpdateWorksheetMediaPayload } from "@/apiRoutes/worksheets";
import { uploadFileToS3 } from "@/utils/AwsXml";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { getPublicDOUrl } from "@/lib/utils";

type LevelItem = { id: string | number; code: string; name: string };
type TopicItem = { id: string | number; name: string };
type FileType = "pdf" | "videos" | "graphics" | "latest_worksheets";

const formSchema = z.object({
  level: z.string().min(1, "Level is required"),
  title: z.string().min(1, "Title is required"),
  year: z.coerce.number().min(2000, "Valid year required"),
  topic: z.string().min(1, "Topic is required"),
});

interface WorksheetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: WorksheetDetail;
  levels: LevelItem[];
  topics: TopicItem[];
  onFetchTopics: (levelId: string) => void;

  onSaveMetadata: (data: WorksheetDetail) => Promise<WorksheetDetail>;
  onPatchWorksheet: (id: string, payload: UpdateWorksheetMediaPayload) => Promise<WorksheetDetail>;
  onDeleteFile: (
    mediaId: string,
    type: string,
    worksheetId: string
  ) => Promise<boolean>;

  isLoading: boolean;
  isFetching?: boolean;
  onSuccess: () => void;
}

export function WorksheetFormDialog({
  open,
  onOpenChange,
  initialData,
  levels,
  topics,
  onFetchTopics,
  onSaveMetadata,
  onPatchWorksheet,
  onDeleteFile,
  isLoading,
  isFetching = false,
  onSuccess,
}: WorksheetFormDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WorksheetDetail>(initialData);
  const [isUploading, setIsUploading] = useState(false);

  const [previewFile, setPreviewFile] = useState<WorksheetFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isStep2Accessible =
    (initialData.id !== "0" && initialData.id !== "") ||
    (formData.id !== "0" && formData.id !== "");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: String(initialData.level),
      title: initialData.title,
      year: initialData.year,
      topic: initialData.topic,
    },
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setFormData(initialData);
      form.reset({
        level: String(initialData.level),
        title: initialData.title,
        year: initialData.year,
        topic: String(initialData.topic),
      });
      if (initialData.level) onFetchTopics(String(initialData.level));
    }
  }, [open, initialData, form]);

  const handleView = (
    item: MediaItem,
    type: FileType
  ) => {
    if (!item || !item.name) return;

    const url = getPublicDOUrl(formData.id, type, item.name);

    setPreviewFile({
      ...item,
      id: item.id || 0,
      type: type,
      url: url,
      uploaded_at: item.uploaded_at || "",
      title: item.name,
      percentage: 100,
    } as WorksheetFile);

    setIsPreviewOpen(true);
  };

  const handleStep1Submit = form.handleSubmit(async (data) => {
    const payload = { ...formData, ...data };
    try {
      const result = await onSaveMetadata(payload);
      setFormData(result);
      setStep(2);
    } catch (error) {
      // Handled by parent
    }
  });

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: FileType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Processing file...");
    let isStateModified = false;
    try {
      const awsOldFile = await doesFileExist(
        `Development/worksheets/${formData.id}/${type}/${file.name}`
      );
      if (awsOldFile) throw new Error("File Exist.");

      const check = await checkWorksheetMedia(formData.id, file.name, type);
      if (check.is_duplicated)
        throw new Error("File already exists. Please rename.");
      if (type === "pdf" && formData.pdf && formData.pdf.id) {
        try {
          await deleteFile(
            `Development/worksheets/${formData.id}/pdf/${formData.pdf.name}`
          );
          setFormData((prev) => ({ ...prev, pdf: undefined }));
        } catch (err) {
          throw new Error("Failed to remove the existing PDF.");
        }
      }

      const env = process.env.NEXT_PUBLIC_AWS_ENV || "Development";
      const key = `${env}/worksheets/${formData.id}/${type}/${file.name}`;

      const { success, url } = await getPresignedUploadUrl(key, file.type);
      if (!success || !url)
        throw new Error("Failed to generate upload permission");

      const newItem: MediaItem = {
        name: file.name,
        type: type,
        percentage: 0,
        timestamp: +new Date(),
        url: url.split("?")[0],
      };

      if (type === "pdf") {
        setFormData((prev) => ({ ...prev, pdf: newItem }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [type]: [...(prev[type] || []), newItem],
        }));
      }
      isStateModified = true;
      
      await uploadFileToS3(url, file, (percent) => {
        setFormData((prev) => {
          if (type === "pdf") {
            return {
              ...prev,
              pdf: { ...(prev.pdf as MediaItem), percentage: percent },
            };
          } else {
            const list = [...(prev[type] || [])];
            const index = list.findIndex(
              (item) =>
                item.name === newItem.name &&
                item.timestamp === newItem.timestamp
            );
            if (index !== -1) {
              list[index] = { ...list[index], percentage: percent };
              return { ...prev, [type]: list };
            }
            return prev;
          }
        });
      });

      const completedItem = { ...newItem, percentage: 100 };

      if (type === "pdf") {
        setFormData((prev) => ({ ...prev, pdf: completedItem }));
        const data = await onPatchWorksheet(formData.id, {
          pdf: completedItem,
        });
        setFormData(data);
      } else {
        const baseList = formData[type] || [];
        const listForBackend = [...baseList, completedItem];

        setFormData((prev) => ({ ...prev, [type]: listForBackend }));

        const data = await onPatchWorksheet(formData.id, {
          [type]: listForBackend,
        });
        setFormData(data);
      }

      toast.success("Uploaded successfully");
    } catch (error: any) {
      console.error(error);
      if (isStateModified) {
        if (type === "pdf") {
          setFormData((prev) => ({ ...prev, pdf: undefined }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [type]: (prev[type] || []).filter(
              (item) => item.name !== file.name
            ),
          }));
        }
      }

      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: FileType;
    index: number;
    mediaId?: string | number;
  } | null>(null);

  const handleRemoveItem = (
    type: FileType,
    index: number,
    mediaId?: string | number
  ) => {
    if (!mediaId) return;
    setDeleteConfirmation({ type, index, mediaId });
  };

  const onConfirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { type, index, mediaId } = deleteConfirmation;
    if (!mediaId) return;

    const uniqueKey = `${type}-${mediaId}`;

    if (type === "pdf") {
      const pdfId = formData.pdf?.id;
      if (!pdfId) return;
      setDeletingId(uniqueKey);
      await onDeleteFile(String(pdfId), type, formData.id);
      setFormData((prev) => ({ ...prev, pdf: undefined }));

      const data = await onPatchWorksheet(formData.id, { pdf: null });
      setFormData(data);
      toast.success("PDF deleted");
    } else {
      setDeletingId(uniqueKey);
      const env = process.env.NEXT_PUBLIC_AWS_ENV || "Development";
      const key = `${env}/worksheets/${formData.id}/${type}/${formData[type][index].name}`;
      try {
        await deleteFile(key);
        await onDeleteFile(String(mediaId), type, formData.id);
        const list = [...formData[type]];
        list.splice(index, 1);

        const data = await onPatchWorksheet(formData.id, { [type]: list });

        setFormData(data);
        toast.success("File deleted");
      } catch (error) {
        toast.error("Failed to delete file");
      } finally {
        setDeletingId(null);
      }
    }
    setDeleteConfirmation(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl! w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              {initialData.id !== "0" ? "Edit Worksheet" : "Create Worksheet"}
            </DialogTitle>
          </DialogHeader>

          {isFetching ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-slate-50/30">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm">Loading details...</p>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 border-r bg-slate-50/50 p-4 space-y-2 hidden sm:block">
                <div
                  onClick={() => setStep(1)}
                  className={`px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                    step === 1
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  1. Form Data
                </div>
                <div
                  onClick={() => {
                    if (isStep2Accessible) setStep(2);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    step === 2
                      ? "bg-primary/10 text-primary"
                      : isStep2Accessible
                      ? "text-slate-600 hover:bg-slate-100 cursor-pointer"
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <span>2. Files</span>
                  {!isStep2Accessible && (
                    <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-500">
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6 relative">
                {step === 1 && (
                  <form
                    id="worksheet-form"
                    onSubmit={handleStep1Submit}
                    className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>
                          Level <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          onValueChange={(val) => {
                            form.setValue("level", val);
                            onFetchTopics(val);
                          }}
                          defaultValue={String(form.getValues("level") || "")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)}>
                                {l.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.level && (
                          <p className="text-red-500 text-xs">
                            {form.formState.errors.level.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Year <span className="text-red-500">*</span>
                        </Label>
                        <Input {...form.register("year")} type="number" />
                        {form.formState.errors.year && (
                          <p className="text-red-500 text-xs">
                            {form.formState.errors.year.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Worksheet Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        {...form.register("title")}
                        placeholder="Enter worksheet title"
                      />
                      {form.formState.errors.title && (
                        <p className="text-red-500 text-xs">
                          {form.formState.errors.title.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Topic <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        onValueChange={(val) => form.setValue("topic", val)}
                        defaultValue={String(form.getValues("topic") || "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.topic && (
                        <p className="text-red-500 text-xs">
                          {form.formState.errors.topic.message}
                        </p>
                      )}
                    </div>
                  </form>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <Label className="mb-2 block font-semibold text-primary">
                        Main PDF Worksheet
                      </Label>
                      {formData.pdf && formData.pdf.name ? (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
                          <div
                            className="p-2 bg-white border rounded text-red-500 cursor-pointer"
                            onClick={() =>
                              handleView(formData.pdf as MediaItem, "pdf")
                            }
                          >
                            <FileText className="h-5 w-5" />
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() =>
                              handleView(formData.pdf as MediaItem, "pdf")
                            }
                          >
                            <p className="text-sm font-medium truncate hover:underline hover:text-blue-600">
                              {formData.pdf.name}
                            </p>
                            <p className="text-xs text-slate-500">Uploaded</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleView(formData.pdf as MediaItem, "pdf")
                              }
                            >
                              <Eye className="h-4 w-4 text-slate-400" />
                            </Button>
                            <div className="relative overflow-hidden">
                              {deletingId ===
                              `pdf-${formData.pdf.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="relative z-10"
                                  disabled={
                                    deletingId === `pdf-${formData.pdf.id}`
                                  }
                                >
                                  Change
                                </Button>
                              )}

                              <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(e, "pdf")}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors relative cursor-pointer">
                          <Upload className="h-8 w-8 text-slate-400" />
                          Click to upload PDF
                          <span className="text-sm font-medium"></span>
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(e, "pdf")}
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </div>

                    <FileUploader
                      title="Videos"
                      type="videos"
                      items={formData.videos}
                      onFileUpload={handleFileUpload}
                      onView={handleView}
                      onRemove={handleRemoveItem}
                      isUploading={isUploading}
                      deletingId={deletingId}
                    />

                    <FileUploader
                      title="Graphics"
                      type="graphics"
                      items={formData.graphics}
                      onFileUpload={handleFileUpload}
                      onView={handleView}
                      onRemove={handleRemoveItem}
      isUploading={isUploading}
                      deletingId={deletingId}
                    />

                    <FileUploader
                      title="Teacher's Copy"
                      type="latest_worksheets"
                      items={formData.latest_worksheets}
                      onFileUpload={handleFileUpload}
                      onView={handleView}
                      onRemove={handleRemoveItem}
                      isUploading={isUploading}
                      deletingId={deletingId}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {!isFetching && (
            <DialogFooter className="px-6 py-4 border-t bg-slate-50">
              {step === 1 ? (
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={form.handleSubmit(handleStep1Submit)}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isUploading}
                  >
                    Back to Form
                  </Button>
                  <Button
                    onClick={() => {
                      onSuccess();
                      onOpenChange(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                    disabled={isUploading}
                  >
                    Save & Close
                  </Button>
                </div>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
      />
      <AlertDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
