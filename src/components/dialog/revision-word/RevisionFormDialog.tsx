"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import AxiosInstance from "@/utils/axiosInstance";
import { fetchTopics } from "@/apiRoutes/topic";
import katex from 'katex';
import ReactQuill from "react-quill-new";

// Styles
import 'katex/dist/katex.min.css';
import 'react-quill-new/dist/quill.snow.css';

if (typeof window !== "undefined") {
    window.katex = katex;
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
    
    // Internal Loading States
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [fraction, setFraction] = useState({ whole: "", num: "", den: "" });
    const quillRef = useRef<any>(null);

    const { register, control, handleSubmit, watch, setValue, reset } = useForm();
    const selectedLevel = watch("level_id");
    const questionText = watch("question_text") || "";

    // 1. Reset Form when Data Arrives (isLoading flips to false)
    useEffect(() => {
        if (open && !isLoading) {
            setStep(1);
            reset(initialData || {});
            setFraction({ whole: "", num: "", den: "" });
            
            // Fetch topics based on loaded data
            if (initialData?.level_id) {
                fetchTopics(initialData.level_id).then(setTopics);
            }
        }
    }, [open, isLoading, initialData, reset]);

    // 2. Dynamic Topic Fetching on Level Change
    useEffect(() => {
        if (selectedLevel && (!initialData?.id || selectedLevel !== initialData.level_id)) {
            fetchTopics(selectedLevel).then(setTopics);
            setValue("subject_id", ""); 
        }
    }, [selectedLevel]);

    const onSubmit = async (data: any) => {
        if (!data.question_text || data.question_text.trim() === "<p><br></p>") {
            toast.error("Question text is required");
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
            
            const payload = { ...data, question_text: textToSend };
            const url = initialData?.id 
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${initialData.id}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums`;
            
            const method = initialData?.id ? "patch" : "post";
            await AxiosInstance[method](url, payload);
            
            toast.success(initialData?.id ? "Updated successfully" : "Created successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modules = {
        toolbar: [ ['bold', 'italic', 'underline'], [{ 'script': 'sub'}, { 'script': 'super' }], ['clean'] ]
    };

    const formats = [ 'header', 'bold', 'italic', 'underline', 'strike', 'script', 'list', 'indent', 'link', 'image', 'formula' ];

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
        if (!fraction.num || !fraction.den) { toast.error("Please enter both numerator and denominator"); return; }
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl! w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
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
                    <div className="w-64 border-r bg-slate-50/50 p-4 space-y-2 hidden sm:block">
                        <div onClick={() => setStep(1)} className={`px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors ${step === 1 ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>1. Details</div>
                        <div onClick={() => setStep(2)} className={`px-4 py-3 rounded-lg cursor-pointer text-sm font-medium transition-colors ${step === 2 ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>2. Content & Layout</div>
                    </div>

                    <div className="flex-1 min-w-0 overflow-y-auto p-6 relative bg-white">
                        <form id="revision-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* STEP 1: Metadata */}
                            <div className={step === 1 ? "block space-y-5" : "hidden"}>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Level <span className="text-red-500">*</span></Label>
                                        <Controller name="level_id" control={control} defaultValue="" render={({ field }) => (
                                            <Select value={String(field.value)} onValueChange={field.onChange}>
                                                <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                                <SelectContent>{levels.data?.map((l:any) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        )} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Topic <span className="text-red-500">*</span></Label>
                                        <Controller name="subject_id" control={control} defaultValue="" render={({ field }) => (
                                            <Select value={String(field.value)} onValueChange={field.onChange}>
                                                <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                                                <SelectContent>{topics.map((t:any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        )} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label>Question No.</Label><Input {...register("question_no")} readOnly className="bg-slate-100 text-muted-foreground" placeholder="Auto-generated" /></div>
                                    <div className="space-y-2"><Label>Difficulty</Label><Controller name="difficulty" control={control} defaultValue="1" render={({ field }) => (<Select value={String(field.value)} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 Star</SelectItem><SelectItem value="2">2 Stars</SelectItem><SelectItem value="3">3 Stars</SelectItem></SelectContent></Select>)} /></div>
                                </div>
                                <div className="space-y-2"><Label>Internal Comment</Label><Textarea {...register("comment")} className="resize-none h-32" /></div>
                            </div>

                            {/* STEP 2: Content */}
                            <div className={step === 2 ? "block space-y-6" : "hidden"}>
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Select Layout</Label>
                                    <div className="bg-slate-50 p-4 rounded-lg border w-full overflow-x-auto">
                                        <Controller name="layout_code" control={control} defaultValue="A" render={({field}) => (
                                            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 min-w-max pb-2">
                                                {LAYOUTS.map(layout => (
                                                    <div key={layout.code} className="flex flex-col items-center space-y-2 w-[160px]">
                                                        <RadioGroupItem value={layout.code} id={`layout-${layout.code}`} className="sr-only" />
                                                        <Label htmlFor={`layout-${layout.code}`} className={`flex flex-col border-2 p-2 rounded-md cursor-pointer transition-all hover:bg-white hover:shadow-md ${field.value === layout.code ? 'border-primary bg-white shadow-sm ring-1 ring-primary' : 'border-transparent'}`}>
                                                            <div className="w-[140px] h-[160px] flex flex-col bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                                                                <div className={`w-full flex flex-col items-center justify-center text-[8px] font-mono text-slate-500 bg-slate-50 border-slate-100 p-1 text-center ${layout.graphicPos === 'top' || layout.graphicPos === 'bottom' ? 'h-1/3 border-b' : 'h-full w-1/3 border-r'} ${layout.graphicPos === 'top' || layout.graphicPos === 'left' ? 'order-1' : 'order-2'}`}>
                                                                    <div className="font-bold mb-0.5">GRAPHIC</div>
                                                                    <div className="text-[10px] leading-tight">{layout.width}</div>
                                                                    <div className="text-[10px] leading-tight">({layout.ratio})</div>
                                                                </div>
                                                                <div className={`w-full flex items-center justify-center text-[10px] font-mono text-slate-400 ${layout.graphicPos === 'top' || layout.graphicPos === 'bottom' ? 'h-2/3' : 'h-full w-2/3'} ${layout.graphicPos === 'top' || layout.graphicPos === 'left' ? 'order-2' : 'order-1'}`}>TEXT</div>
                                                            </div>
                                                            <div className="text-center mt-2 text-xs font-bold text-slate-700">{layout.code}</div>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Question Text</Label>
                                    <div className="flex gap-3 mb-2 flex-wrap text-xl font-bold text-slate-700 select-none">
                                        {SYMBOLS.map((sym, i) => (<span key={i} onClick={() => insertSymbol(sym.char)} className="cursor-pointer hover:bg-slate-100 rounded px-2">{sym.char}</span>))}
                                    </div>
                                    <Controller name="question_text" control={control} defaultValue="" render={({ field }) => (
                                        <div className="prose-editor-wrapper">
                                            <ReactQuill ref={quillRef} theme="snow" value={field.value} onChange={field.onChange} modules={modules} formats={formats} className="h-48 mb-12" />
                                        </div>
                                    )} />
                                    {(!questionText || questionText === "<p><br></p>") && (<p className="text-red-500 text-xs mt-1">Required</p>)}
                                    <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                                        <Button type="button" variant="secondary" onClick={insertFraction} className="bg-slate-200 hover:bg-slate-300 text-slate-800">Insert Fractions</Button>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={fraction.whole} onChange={(e) => setFraction({...fraction, whole: e.target.value})} className="w-12 h-10 border rounded px-2 text-center text-sm" placeholder="#" />
                                            <div className="flex flex-col gap-1 items-center">
                                                <input type="number" value={fraction.num} onChange={(e) => setFraction({...fraction, num: e.target.value})} className="w-12 h-7 border rounded px-1 text-center text-xs" placeholder="Num" />
                                                <div className="w-full h-px bg-black"></div>
                                                <input type="number" value={fraction.den} onChange={(e) => setFraction({...fraction, den: e.target.value})} className="w-12 h-7 border rounded px-1 text-center text-xs" placeholder="Den" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-8">
                                    <Label className="text-base font-semibold">Question Graphic</Label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 relative cursor-pointer">
                                        <ImageIcon className="h-6 w-6 text-slate-400" />
                                        <p className="text-sm">Click to upload graphic</p>
                                        <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-slate-50">
                   {step === 1 ? <Button onClick={() => setStep(2)}>Next</Button> : <Button onClick={handleSubmit(onSubmit)} className="bg-green-600 text-white" disabled={isSubmitting}>
                       {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save
                   </Button>}
                </DialogFooter>
                </>
                )}
            </DialogContent>
        </Dialog>
    );
}