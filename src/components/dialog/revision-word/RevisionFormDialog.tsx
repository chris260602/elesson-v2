"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { fetchRevisionTopics, fetchAutoQuestionNumber, createRevisionQuestion, updateRevisionQuestion, fetchPresignedViewUrl, updateRevisionFile } from "@/apiRoutes/revision-words";
import katex from 'katex';
import ReactQuill from "react-quill-new";
import { WorksheetFile } from "@/types/worksheet";
import { FileRow } from "@/components/core/FileRow";
import { RevisionFilePreviewDialog } from "./RevisionFilePreviewDialog";
import { deleteFile, doesFileExist, getPresignedUploadUrl } from "@/app/actions/s3";
import { uploadFileToS3 } from "@/utils/AwsXml";

export function RevisionFileUploader({
    title,
    type,
    items,
    onFileUpload,
    onView,
    onRemove,
    isUploading,
    deletingId,
}: {
    title: string;
    type: "question_graphic" | "video_solution" | "written_solution";
    items: WorksheetFile[];
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "question_graphic" | "video_solution" | "written_solution") => void;
    onView: (item: WorksheetFile, type: string) => void;
    onRemove: (type: "question_graphic" | "video_solution" | "written_solution", index: number, mediaId?: string | number) => void;
    isUploading: boolean;
    deletingId: string | null;
}) {
    return (
        <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
                <Label className="block font-semibold text-primary">{title}</Label>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="relative h-7 text-xs gap-1"
                    disabled={isUploading}
                >
                    <Upload className="h-3 w-3" /> {items.length > 0 ? "Change" : "Add"} {title}
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        accept={type === "video_solution" ? "video/*" : "image/*,.pdf"}
                        onChange={(e) => onFileUpload(e, type)}
                        disabled={isUploading}
                    />
                </Button>
            </div>
            {items.length === 0 && (
                <p className="text-sm text-slate-400 italic pl-1">
                    No {title.toLowerCase()} uploaded.
                </p>
            )}
            {items.map((item, i) => (
                <FileRow
                    key={i}
                    item={item}
                    type={"graphics" as any}
                    index={i}
                    onView={(item) => onView(item, type)}
                    onRemove={(removedType, index, mediaId) => onRemove(type, index, mediaId)}
                    deletingId={deletingId === type ? `graphics-${item.id}` : null}
                />
            ))}
        </div>
    );
}

// Styles
import 'katex/dist/katex.min.css';
import 'react-quill-new/dist/quill.snow.css';
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";

if (typeof window !== "undefined") {
    (window as any).katex = katex;
}

const LAYOUTS = [
    { code: "A", label: "Text Top", width: "952 x 326", ratio: "3:1", graphicPos: "bottom" },
    { code: "B", label: "Graphic Top", width: "952 x 88", ratio: "10:1", graphicPos: "top" },
    { code: "C", label: "Graphic Right", width: "342 x 366", ratio: "1:1", graphicPos: "right" },
    { code: "D", label: "Graphic Left", width: "342 x 366", ratio: "1:1", graphicPos: "left" },
    { code: "E", label: "Text Top (Small)", width: "952 x 176", ratio: "5:1", graphicPos: "bottom" },
    { code: "F", label: "Graphic Top (Small)", width: "952 x 176", ratio: "5:1", graphicPos: "top" },
];

const SYMBOLS = [
    { char: "∠", entity: "&#8736;" }, { char: "△", entity: "&#9651;" }, { char: "≈", entity: "&#8776;" },
    { char: "¢", entity: "&#162;" }, { char: "°", entity: "&#176;" }, { char: "✓", entity: "&#10003;" },
    { char: "⊥", entity: "&#10178;" }, { char: "π", entity: "&#960;" }
];

export function RevisionFormDialog({ open, onOpenChange, initialData, isLoading, levels, onSuccess }: any) {
    const [step, setStep] = useState(1);
    const [topics, setTopics] = useState<any[]>([]);
    const [isTopicsLoading, setIsTopicsLoading] = useState(false);
    const [isQuestionNoLoading, setIsQuestionNoLoading] = useState(false);

    // Internal State for Deletion Confirmation
    const [mediaToRemove, setMediaToRemove] = useState<"question_graphic" | "video_solution" | "written_solution" | null>(null);

    // Internal Loading States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdId, setCreatedId] = useState<number | null>(null);
    const [uploadFiles, setUploadFiles] = useState<{
        question_graphic: WorksheetFile[];
        video_solution: WorksheetFile[];
        written_solution: WorksheetFile[];
    }>({ question_graphic: [], video_solution: [], written_solution: [] });
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<WorksheetFile | null>(null);

    const [fraction, setFraction] = useState({ whole: "", num: "", den: "" });
    const quillRef = useRef<any>(null);

    const { register, control, handleSubmit, watch, setValue, reset } = useForm({
        defaultValues: {
            level_id: "",
            subject_id: "",
            difficulty: "1",
            question_no: "",
            comment: "",
            question_text: ""
        }
    });
    const selectedSubject = watch("subject_id");
    const questionText = watch("question_text") || "";
    const selectedLevel = watch("level_id");

    // Ref to track the level loaded from initialData, so we don't clear subject on programmatic reset
    const resetLevelRef = useRef<string>("");

    // Handles the Level <Select> change — only called by real user interaction
    const handleLevelChange = (newLevel: string, fieldOnChange: (v: string) => void) => {
        fieldOnChange(newLevel); // keep RHF field.value in sync so the Select displays correctly
        // Only clear subject + refetch if user picked a DIFFERENT level than what was loaded
        if (newLevel !== resetLevelRef.current) {
            setValue("subject_id", "");
            setIsTopicsLoading(true);
            fetchRevisionTopics(newLevel)
                .then(res => setTopics(res || []))
                .catch(err => console.error(err))
                .finally(() => setIsTopicsLoading(false));
        }
        // After first real user interaction, clear the ref so future changes always go through
        resetLevelRef.current = "";
    };

    // 1. Reset Form when Data Arrives (isLoading flips to false)
    useEffect(() => {
        if (open && !isLoading) {
            const raw = initialData?.data || initialData || {};

            // Pre-format numeric IDs as Strings for the UI selects
            const actualData = {
                ...raw,
                level_id: raw.level_id?.toString() || "",
                subject_id: raw.subject_id?.toString() || "",
                difficulty: raw.difficulty?.toString() || "1",
            };

            // Store the loaded level so handleLevelChange won't clear subject if user re-selects same level
            resetLevelRef.current = actualData.level_id;

            setStep(1);
            reset(actualData);
            setFraction({ whole: "", num: "", den: "" });
            setCreatedId(actualData.id || null);
            setUploadFiles({
                question_graphic: actualData.question_graphic ? [{ name: actualData.question_graphic, url: "", type: "question_graphic", percentage: 100, timestamp: "0" }] : [],
                video_solution: actualData.video_solution ? [{ name: actualData.video_solution, url: "", type: "video_solution", percentage: 100, timestamp: "0" }] : [],
                written_solution: actualData.written_solution ? [{ name: actualData.written_solution, url: "", type: "written_solution", percentage: 100, timestamp: "0" }] : [],
            });

            // Fetch topics based on loaded data
            if (raw.level_id) {
                setIsTopicsLoading(true);
                fetchRevisionTopics(raw.level_id)
                    .then(res => {
                        setTopics(res || []);
                    })
                    .catch(err => console.error(err))
                    .finally(() => setIsTopicsLoading(false));
            }
        }
    }, [open, isLoading, initialData, reset]);

    // Handlers
    const getFolderType = (type: string) => {
        if (type === "question_graphic") return "questionGraphic";
        if (type === "video_solution") return "videoSolution";
        return "writtenSolution";
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "question_graphic" | "video_solution" | "written_solution") => {
        const file = e.target.files?.[0];
        if (!file || !createdId) return;

        setIsUploadingMedia(true);
        try {
            const folderName = getFolderType(type);
            const env = process.env.NEXT_PUBLIC_AWS_ENV || "Development";

            // If a previous file exists, attempt to delete it first to prevent orphans
            const existingFiles = uploadFiles[type];
            if (existingFiles && existingFiles.length > 0) {
                const oldFile = existingFiles[0];
                const oldKey = `${env}/e-resource/revision-word-problems/${createdId}/${folderName}/${oldFile.name}`;
                console.log(`[REPLACING] Deleting old file: ${oldKey}`);
                try {
                    const delRes = await deleteFile(oldKey);
                    if (!delRes.success) {
                        console.warn("S3 deletion reported failure, continuing anyway...");
                    }
                } catch (err) {
                    console.error("Could not delete legacy file. Silently continuing replacement.", err);
                }
            }

            const key = `${env}/e-resource/revision-word-problems/${createdId}/${folderName}/${file.name}`;

            const { success, url } = await getPresignedUploadUrl(key, file.type);
            if (!success || !url) throw new Error("Failed to generate upload permission");

            const newItem: WorksheetFile = {
                name: file.name,
                type: type as any,
                percentage: 0,
                timestamp: String(+new Date()),
                url: url.split("?")[0],
            };

            setUploadFiles(prev => ({ ...prev, [type]: [newItem] }));

            await uploadFileToS3(url, file, (percent) => {
                setUploadFiles(prev => {
                    const list = prev[type];
                    if (list.length > 0) {
                        return { ...prev, [type]: [{ ...list[0], percentage: percent }] };
                    }
                    return prev;
                });
            });

            setUploadFiles(prev => ({ ...prev, [type]: [{ ...newItem, percentage: 100 }] }));

            await updateRevisionFile(createdId, { type: type, value: file.name });
            showSuccessMessage("File uploaded successfully");

        } catch (error) {
            console.error(error);
            showErrorMessage("File upload failed");
            setUploadFiles(prev => ({ ...prev, [type]: [] }));
        } finally {
            setIsUploadingMedia(false);
            e.target.value = "";
        }
    };

    const handleRemoveItem = async (type: "question_graphic" | "video_solution" | "written_solution") => {
        if (!createdId) return;
        const items = uploadFiles[type];
        if (!items || items.length === 0) return;
        const file = items[0];

        setDeletingId(type);
        try {
            const folderName = getFolderType(type);
            const env = process.env.NEXT_PUBLIC_AWS_ENV || "Development";
            const key = `${env}/e-resource/revision-word-problems/${createdId}/${folderName}/${file.name}`;

            await deleteFile(key);
            await updateRevisionFile(createdId, { type: type, value: null });

            setUploadFiles(prev => ({ ...prev, [type]: [] }));
            showSuccessMessage("Media deleted");
        } catch (error) {
            console.error(error);
            showErrorMessage("Failed to delete media");
        } finally {
            setDeletingId(null);
            setMediaToRemove(null);
        }
    };

    const handleView = (item: WorksheetFile, type: string) => {
        const folderName = getFolderType(type);
        const path = `e-resource/revision-word-problems/${createdId}/${folderName}/${item.name}`;

        let previewType = "pdf";
        if (type === "video_solution") previewType = "videos";
        else if (item.name.match(/\.(jpg|jpeg|png|gif)$/i)) previewType = "graphics";

        setPreviewFile({ ...item, path, type: previewType as any });
    };

    // 2. Auto-generated Question Number
    useEffect(() => {
        if (selectedLevel && selectedSubject && !initialData?.id && !createdId) {
            setIsQuestionNoLoading(true);
            fetchAutoQuestionNumber(selectedLevel, selectedSubject)
                .then(no => setValue("question_no", no))
                .catch(err => console.error("Failed to fetch auto question number", err))
                .finally(() => setIsQuestionNoLoading(false));
        }
    }, [selectedLevel, selectedSubject, initialData?.id, createdId, setValue]);

    const handleNext = async () => {
        const data = watch();
        if (!data.level_id || !data.subject_id) {
            showErrorMessage("Level and Topic are required");
            return;
        }

        if (initialData?.id || createdId) {
            setStep(2);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                level_id: Number(data.level_id),
                subject_id: Number(data.subject_id),
                difficulty: Number(data.difficulty) || 1,
                comment: data.comment || "",
                layout_code: "A",
                question_text: "<p><br></p>"
            };
            const res = await createRevisionQuestion(payload);

            setCreatedId(res.data.id);
            setStep(2);
        } catch (error) {
            console.error(error);
            showErrorMessage("Failed to proceed to next step");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = async (data: any) => {
        if (!data.question_text || data.question_text.trim() === "<p><br></p>") {
            showErrorMessage("Question text is required");
            return;
        }

        setIsSubmitting(true);
        try {
            let textToSend = data.question_text;
            const fractionRegex = /(\d*)\\frac\{(\d+)\}\{(\d+)\}/g;
            textToSend = textToSend.replace(fractionRegex, (match: string, whole: string, num: string, den: string) => {
                const latex = whole ? `${whole}\\frac{${num}}{${den}}` : `\\frac{${num}}{${den}}`;
                const renderedHtml = katex.renderToString(latex, { throwOnError: false });
                return `<span class="ql-formula" data-value="${latex}" contenteditable="false">${renderedHtml}</span>`;
            });

            const payload = {
                ...data,
                question_text: textToSend,
                level_id: Number(data.level_id),
                subject_id: Number(data.subject_id),
                difficulty: Number(data.difficulty),
            };
            const currentId = initialData?.id || createdId;

            if (currentId) {
                await updateRevisionQuestion(currentId, payload);
            } else {
                await createRevisionQuestion(payload);
            }

            showSuccessMessage(initialData?.id ? "Updated successfully" : "Created successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            showErrorMessage("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modules = {
        toolbar: [['bold', 'italic', 'underline'], [{ 'script': 'sub' }, { 'script': 'super' }], ['clean']]
    };

    const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'script', 'list', 'indent', 'link', 'image', 'formula'];

    const insertSymbol = (symbol: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);
            if (range) {
                editor.insertText(range.index, symbol);
                editor.setSelection(range.index + symbol.length);
            }
        }
    };

    const insertFraction = () => {
        const editor = quillRef.current?.getEditor();
        if (!fraction.num || !fraction.den) { showErrorMessage("Please enter both numerator and denominator"); return; }
        const range = editor.getSelection(true);
        if (range) {
            const latex = fraction.whole ? `${fraction.whole}\\frac{${fraction.num}}{${fraction.den}}` : `\\frac{${fraction.num}}{${fraction.den}}`;
            const renderedHtml = katex.renderToString(latex, { throwOnError: false });
            const rawHtml = `<span class="ql-formula" data-value="${latex}" contenteditable="false">${renderedHtml}</span>&nbsp;`;
            editor.clipboard.dangerouslyPasteHTML(range.index, rawHtml);
            setFraction({ whole: "", num: "", den: "" });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl! w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden" onInteractOutside={e => e.preventDefault()}>
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>{isLoading ? "Loading..." : (initialData?.id ? "Edit Revision Question" : "New Revision Question")}</DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading form data...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-1 overflow-hidden">
                                <div className="w-64 border-r bg-slate-50/50 dark:bg-gray-700/50 p-4 space-y-2 hidden sm:block">
                                    <div onClick={() => setStep(1)} className={`px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors ${step === 1 ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-black"}`}>1. Details</div>
                                    <div onClick={() => { if (initialData?.id || createdId) setStep(2); else showErrorMessage("Please click Next to save details first."); }} className={`px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors ${step === 2 ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-black"} ${(!initialData?.id && !createdId) && step === 1 ? "opacity-50" : ""}`}>2. Content & Layout</div>
                                </div>

                                <div className="flex-1 min-w-0 overflow-y-auto p-6 relative">
                                    <form id="revision-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        {/* STEP 1: Metadata */}
                                        <div className={step === 1 ? "block space-y-5" : "hidden"}>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label>Level <span className="text-red-500">*</span></Label>
                                                    <Controller name="level_id" control={control} defaultValue="" render={({ field }) => (
                                                        <Select value={field.value?.toString() || ""} onValueChange={(v) => handleLevelChange(v, field.onChange)}>
                                                            <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                                            <SelectContent>{levels.data?.map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    )} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Topic <span className="text-red-500">*</span></Label>
                                                    <Controller name="subject_id" control={control} defaultValue="" render={({ field }) => (
                                                        <Select value={field.value?.toString() || ""} onValueChange={field.onChange} disabled={isTopicsLoading}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={isTopicsLoading ? "Loading topics..." : "Select Topic"} />
                                                                {isTopicsLoading && <Loader2 className="h-3 w-3 animate-spin ml-2 text-muted-foreground" />}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {topics.map((t: any) => {
                                                                    const tId = t.id ?? t.subject_id ?? t.main_topic_id ?? t.topic_id;
                                                                    const tName = t.name ?? t.subject_name ?? t.title ?? t.main_topic_name ?? t.topic_name;
                                                                    return (
                                                                        <SelectItem key={String(tId)} value={String(tId)}>
                                                                            {tName}
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    )} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label>Question No.</Label>
                                                    <div className="relative">
                                                        <Input
                                                            {...register("question_no")}
                                                            readOnly
                                                            className="bg-slate-100 text-muted-foreground pr-8"
                                                            placeholder={isQuestionNoLoading ? "Fetching..." : "Auto-generated"}
                                                        />
                                                        {isQuestionNoLoading && (
                                                            <div className="absolute right-2.5 top-2.5">
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2"><Label>Difficulty</Label><Controller name="difficulty" control={control} defaultValue="1" render={({ field }) => (<Select value={String(field.value)} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 Star</SelectItem><SelectItem value="2">2 Stars</SelectItem><SelectItem value="3">3 Stars</SelectItem></SelectContent></Select>)} /></div>
                                            </div>
                                            <div className="space-y-2"><Label>Internal Comment</Label><Textarea {...register("comment")} className="resize-none h-32" /></div>
                                        </div>

                                        {/* STEP 2: Content */}
                                        <div className={step === 2 ? "block space-y-6" : "hidden"}>
                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold">Select Layout</Label>
                                                <div className="bg-slate-50 dark:bg-gray-700 p-4 rounded-lg border w-full overflow-x-auto">
                                                    <Controller name="layout_code" control={control} defaultValue="A" render={({ field }) => (
                                                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 min-w-max pb-2">
                                                            {LAYOUTS.map(layout => (
                                                                <div key={layout.code} className="flex flex-col items-center space-y-2 w-[160px]">
                                                                    <RadioGroupItem value={layout.code} id={`layout-${layout.code}`} className="sr-only" />
                                                                    <Label htmlFor={`layout-${layout.code}`} className={`flex flex-col border-2 p-2 rounded-md cursor-pointer transition-all hover:bg-white dark:hover:bg-black hover:shadow-md ${field.value === layout.code ? 'border-primary bg-white dark:bg-black shadow-sm ring-1 ring-primary' : 'border-transparent'}`}>
                                                                        <div className="w-[140px] h-[160px] flex flex-col bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                                                                            <div className={`w-full flex flex-col items-center justify-center text-[8px] font-mono text-slate-500 bg-slate-50 border-slate-100 p-1 text-center ${layout.graphicPos === 'top' || layout.graphicPos === 'bottom' ? 'h-1/3 border-b' : 'h-full w-1/3 border-r'} ${layout.graphicPos === 'top' || layout.graphicPos === 'left' ? 'order-1' : 'order-2'}`}>
                                                                                <div className="font-bold mb-0.5">GRAPHIC</div>
                                                                                <div className="text-[10px] leading-tight">{layout.width}</div>
                                                                                <div className="text-[10px] leading-tight">({layout.ratio})</div>
                                                                            </div>
                                                                            <div className={`w-full flex items-center justify-center text-[10px] font-mono text-slate-400 ${layout.graphicPos === 'top' || layout.graphicPos === 'bottom' ? 'h-2/3' : 'h-full w-2/3'} ${layout.graphicPos === 'top' || layout.graphicPos === 'left' ? 'order-2' : 'order-1'}`}>TEXT</div>
                                                                        </div>
                                                                        <div className="text-center mt-2 text-xs font-bold text-slate-700 dark:text-white">{layout.code}</div>
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    )} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-base font-semibold">Question Text</Label>

                                                {/* Symbols Toolbar */}
                                                <div className="flex flex-wrap items-center gap-2 p-1.5 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 w-max mb-3">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase px-2 tracking-wider select-none">Symbols</span>
                                                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                                                    <div className="flex items-center gap-1">
                                                        {SYMBOLS.map(sym => (
                                                            <Button
                                                                key={sym.char}
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all shadow-none border-slate-200"
                                                                onClick={() => insertSymbol(sym.char)}
                                                                title={`Insert ${sym.char}`}
                                                            >
                                                                {sym.char}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Controller name="question_text" control={control} defaultValue="" render={({ field }) => (
                                                    <div className="prose-editor-wrapper">
                                                        <ReactQuill ref={quillRef} theme="snow" value={field.value} onChange={field.onChange} modules={modules} formats={formats} className="h-48 mb-12" />
                                                    </div>
                                                )} />
                                                {(!questionText || questionText === "<p><br></p>") && (<p className="text-red-500 text-xs mt-1">Required</p>)}

                                                {/* Fraction Builder */}
                                                <div className="mt-6 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/20 shadow-sm flex flex-col gap-3">
                                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                        Insert Fraction
                                                    </Label>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-4">
                                                            {/* Whole Number */}
                                                            <Input
                                                                type="number"
                                                                value={fraction.whole}
                                                                onChange={(e) => setFraction({ ...fraction, whole: e.target.value })}
                                                                className="w-16 h-12 text-center text-lg font-medium shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                placeholder="0"
                                                            />

                                                            {/* Numerator / Denominator Stack */}
                                                            <div className="flex flex-col gap-2 items-center w-16">
                                                                <Input
                                                                    type="number"
                                                                    value={fraction.num}
                                                                    onChange={(e) => setFraction({ ...fraction, num: e.target.value })}
                                                                    className="w-full h-8 text-center text-sm shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-1"
                                                                    placeholder="Num"
                                                                />
                                                                <div className="w-full h-[2px] bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                                                <Input
                                                                    type="number"
                                                                    value={fraction.den}
                                                                    onChange={(e) => setFraction({ ...fraction, den: e.target.value })}
                                                                    className="w-full h-8 text-center text-sm shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-1"
                                                                    placeholder="Den"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="h-12 w-px bg-slate-200 dark:bg-slate-700"></div>

                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={insertFraction}
                                                            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-sm"
                                                        >
                                                            <span className="font-semibold">Insert into Editor</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-8">
                                                <RevisionFileUploader
                                                    title="Question Graphic"
                                                    type="question_graphic"
                                                    items={uploadFiles.question_graphic}
                                                    onFileUpload={handleFileUpload}
                                                    onView={handleView}
                                                    onRemove={() => setMediaToRemove("question_graphic")}
                                                    isUploading={isUploadingMedia}
                                                    deletingId={deletingId}
                                                />
                                                <hr className="my-5" />
                                                <RevisionFileUploader
                                                    title="Video Solution"
                                                    type="video_solution"
                                                    items={uploadFiles.video_solution}
                                                    onFileUpload={handleFileUpload}
                                                    onView={handleView}
                                                    onRemove={() => setMediaToRemove("video_solution")}
                                                    isUploading={isUploadingMedia}
                                                    deletingId={deletingId}
                                                />
                                                <hr className="my-5" />
                                                <RevisionFileUploader
                                                    title="Written Solution"
                                                    type="written_solution"
                                                    items={uploadFiles.written_solution}
                                                    onFileUpload={handleFileUpload}
                                                    onView={handleView}
                                                    onRemove={() => setMediaToRemove("written_solution")}
                                                    isUploading={isUploadingMedia}
                                                    deletingId={deletingId}
                                                />
                                                <hr className="my-5" />
                                                <div className="space-y-2">
                                                    <Label className="text-base font-semibold">Answer</Label>
                                                    <Input {...register("answer")} placeholder="Answer..." disabled />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <DialogFooter className="px-6 py-4 border-t">
                                {step === 1 ? <Button onClick={handleNext} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Next</Button> : <Button onClick={handleSubmit(onSubmit)} className="bg-green-600 text-white" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                                </Button>}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            {previewFile && (
                <RevisionFilePreviewDialog
                    open={!!previewFile}
                    onOpenChange={(v) => !v && setPreviewFile(null)}
                    file={previewFile}
                />
            )}

            {/* DELETION CONFIRMATION DIALOG */}
            <AlertDialog open={!!mediaToRemove} onOpenChange={(open) => !open && setMediaToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this media?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the file from the server.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => mediaToRemove && handleRemoveItem(mediaToRemove)}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}