"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RevisionProblem } from "@/types/revision";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import katex from "katex";
import { fetchPresignedViewUrl } from "@/apiRoutes/revision-words";

import "katex/dist/katex.min.css";
import "react-quill-new/dist/quill.bubble.css";

if (typeof window !== "undefined") {
    (window as any).katex = katex;
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
        switch (code) {
            case 'A': return "flex-col";
            case 'B': return "flex-col-reverse";
            case 'C': return "flex-row";
            case 'D': return "flex-row-reverse";
            case 'E': return "flex-col";
            case 'F': return "flex-col-reverse";
            default: return "flex-col";
        }
    };

    const [graphicUrl, setGraphicUrl] = useState<string | null>(null);
    const [isGraphicLoading, setIsGraphicLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadGraphic = async () => {
            if (!open || !data?.question_graphic) {
                setGraphicUrl(null);
                return;
            }

            setIsGraphicLoading(true);
            try {
                // Construct the path for the question graphic
                const path = `e-resource/revision-word-problems/${data.id}/questionGraphic/${data.question_graphic}`;
                const url = await fetchPresignedViewUrl(path);
                if (isMounted) {
                    setGraphicUrl(url);
                }
            } catch (err) {
                console.error("Failed to load preview graphic:", err);
            } finally {
                if (isMounted) {
                    setIsGraphicLoading(false);
                }
            }
        };

        loadGraphic();
        return () => { isMounted = false; };
    }, [open, data?.id, data?.question_graphic]);

    const isHorizontal = data ? ['C', 'D'].includes(data.layout_code as string) : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl! h-[80vh] overflow-hidden flex flex-col" onInteractOutside={e => e.preventDefault()}>
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
                    <div className="flex-1 border rounded-lg bg-white dark:bg-black p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className={`flex gap-4 h-full ${getLayoutClasses(data.layout_code as string)}`}>
                            <div className={`border rounded p-4 flex items-center justify-center bg-slate-50 dark:bg-gray-700 overflow-y-auto ${isHorizontal ? 'w-1/2 h-full' : 'w-full h-1/2'}`}>
                                {data.question_text ? (
                                    <div 
                                        className="ql-editor w-full h-full" 
                                        dangerouslySetInnerHTML={{ __html: data.question_text }} 
                                    />
                                ) : <span className="text-muted-foreground">No Question Text</span>}
                            </div>
                            <div className={`border rounded p-4 flex items-center justify-center bg-slate-100 dark:bg-gray-700 ${isHorizontal ? 'w-1/2 h-full' : 'w-full h-1/2'} relative`}>
                                {isGraphicLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground">Loading Graphic...</span>
                                    </div>
                                ) : data.question_graphic && graphicUrl ? (
                                    <img src={graphicUrl} alt="Question Graphic" className="max-w-full max-h-full object-contain shadow-sm" />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <p>{data.question_graphic ? "Failed to load graphic" : "No Graphic Uploaded"}</p>
                                        <p className="text-xs">Layout: {data.layout_code}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}