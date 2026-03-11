"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RevisionProblem } from "@/types/revision";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import katex from "katex";

import "katex/dist/katex.min.css";
import "react-quill-new/dist/quill.bubble.css";

if (typeof window !== "undefined") {
  window.katex = katex;
}

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface PreviewProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    data: RevisionProblem | null;
    isLoading: boolean;
}

export function PreviewDialog({ open, onOpenChange, data, isLoading }: PreviewProps) {
    const getLayoutClasses = (code: string) => {
        switch(code) {
            case 'A': return "flex-col";         
            case 'B': return "flex-col-reverse"; 
            case 'C': return "flex-row";         
            case 'D': return "flex-row-reverse"; 
            case 'E': return "flex-col";         
            case 'F': return "flex-col-reverse"; 
            default: return "flex-col";
        }
    };

    const isHorizontal = data ? ['C', 'D'].includes(data.layout_code) : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl! h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isLoading ? "Loading Preview..." : `Preview ${data ? `(Layout ${data.layout_code})` : ''}`}</DialogTitle>
                </DialogHeader>
                
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in fade-in zoom-in-95 duration-200">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p>Fetching question data...</p>
                    </div>
                ) : !data ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-2">
                        <AlertCircle className="h-10 w-10" />
                        <p>Failed to load preview data.</p>
                    </div>
                ) : (
                    <div className="flex-1 border rounded-lg bg-white p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className={`flex gap-4 h-full ${getLayoutClasses(data.layout_code)}`}>
                            <div className={`border rounded p-4 flex items-center justify-center bg-slate-50 overflow-y-auto ${isHorizontal ? 'w-1/2 h-full' : 'w-full h-1/2'}`}>
                                {data.question_text ? (
                                    <ReactQuill value={data.question_text} readOnly={true} theme="bubble" className="w-full h-full" />
                                ) : <span className="text-muted-foreground">No Question Text</span>}
                            </div>
                            <div className={`border rounded p-4 flex items-center justify-center bg-slate-100 ${isHorizontal ? 'w-1/2 h-full' : 'w-full h-1/2'}`}>
                                {data.question_graphic ? (
                                    <img src={`https://s3-bucket-url/${data.id}/${data.question_graphic}`} alt="Question Graphic" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-center text-muted-foreground"><p>No Graphic Uploaded</p><p className="text-xs">Layout: {data.layout_code}</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}