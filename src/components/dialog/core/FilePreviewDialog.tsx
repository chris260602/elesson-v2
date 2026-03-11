"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, AlertCircle, FileText, Ban } from "lucide-react";
import { WorksheetFile } from "@/types/worksheet";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: WorksheetFile | null;
}

export function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<"none" | "not_found" | "generic">("none");

  // 1. DETERMINE FILE TYPE
  const ext = file?.name?.split('.').pop()?.toLowerCase() || '';
  const isPdf = file?.type === 'pdf' || ext === 'pdf';
  const isImage = file?.type === 'image' || file?.type === 'graphics' || ['jpg','jpeg','png','gif','webp'].includes(ext);
  const isVideo = file?.type === 'video' || file?.type === 'videos' || ['mp4','mov','avi','webm'].includes(ext);
  const isOffice = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext) || file?.type === 'office';

  useEffect(() => {
    let isMounted = true;

    const validateFile = async () => {
      if (!open || !file?.url) return;

      setIsLoading(true);
      setErrorType("none");

      try {
        // Check if file exists via HEAD request
        const response = await fetch(file.url, { method: "HEAD" });
        
        if (isMounted) {
          if (response.status === 404) {
            setErrorType("not_found");
            setIsLoading(false);
          } else if (!response.ok) {
            setErrorType("generic");
            setIsLoading(false);
          } else {
            // SUCCESS: File exists (Status 200)
            // As requested: Stop loading immediately for ALL file types
            setIsLoading(false); 
          }
        }
      } catch (err) {
        console.error("Preview validation error:", err);
        if (isMounted) {
             setErrorType("generic");
             setIsLoading(false);
        }
      }
    };

    if (open) {
      validateFile();
    } else {
      // Reset on close
      setIsLoading(true);
      setErrorType("none");
    }

    return () => { isMounted = false; };
  }, [open, file]);

  if (!file || !file.url) return null;

  // Fallback handler if the actual resource fails to render (e.g. valid URL but corrupt image)
  const handleError = () => {
    // Only trigger error if we aren't already in an error state
    if (errorType === "none") {
        setErrorType("generic");
    }
    setIsLoading(false);
  };

  const hasError = errorType !== "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        
        {/* Header */}
        <DialogHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-primary absolute top-0 left-0 right-0 z-50 backdrop-blur-sm rounded-t-lg shadow-md">
          <DialogTitle className="truncate pr-8 text-white flex items-center gap-2 font-medium">
            {file.name}
          </DialogTitle>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden relative pt-16 pb-4 px-4 bg-zinc-100/50">
            
            {/* Loading Spinner */}
            {isLoading && !hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm bg-white/50">
                    <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
                    <p className="text-sm font-medium text-zinc-600">Loading Preview...</p>
                </div>
            )}

            {/* Error States */}
            {hasError && (
                 <div className="text-center text-red-500 z-20 p-8 bg-white rounded-xl shadow-xl max-w-sm">
                    {errorType === "not_found" ? (
                        <>
                            <Ban className="h-12 w-12 mx-auto mb-3 opacity-80" />
                            <p className="text-lg font-semibold">File Not Found</p>
                            <p className="text-sm mt-2 text-zinc-500">The file you are looking for has been moved or deleted.</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-80" />
                            <p className="text-lg font-semibold">Unable to load file</p>
                            <p className="text-sm mt-2 text-zinc-500">The file format might be unsupported or the file is corrupted.</p>
                        </>
                    )}
                    
                    <Button variant="outline" className="mt-6 w-full" onClick={() => onOpenChange(false)}>
                        Close Preview
                    </Button>
                </div>
            )}

            {/* --- VIEWERS --- */}

            {/* 1. PDF Viewer */}
            {!hasError && isPdf && (
                <iframe 
                    src={file.url} 
                    className={`w-full h-full rounded-lg bg-white shadow-sm transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onError={handleError}
                    title="PDF Preview"
                />
            )}

            {/* 2. Image Viewer */}
            {!hasError && isImage && (
                <img 
                    src={file.url} 
                    alt={file.name} 
                    className={`max-w-full max-h-full object-contain shadow-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onError={handleError}
                />
            )}

            {/* 3. Video Viewer */}
            {!hasError && isVideo && (
                <video 
                    controls 
                    className={`max-w-full max-h-full rounded-lg shadow-lg focus:outline-none transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onError={handleError}
                    controlsList="nodownload" 
                    onContextMenu={(e) => e.preventDefault()} 
                    autoPlay
                >
                    <source src={file.url} />
                    <p className="text-zinc-500">Your browser does not support the video tag.</p>
                </video>
            )}

            {/* 4. Office Viewer */}
            {!hasError && isOffice && (
                <iframe 
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                    className={`w-full h-full rounded-lg bg-white shadow-sm transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onError={handleError}
                    title="Office Preview"
                />
            )}
            
            {/* 5. Fallback for Unknown Types */}
            {!hasError && !isPdf && !isImage && !isVideo && !isOffice && !isLoading && (
                 <div className="text-center p-8 bg-white border border-zinc-200 rounded-lg shadow-sm">
                    <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">Preview not supported</h3>
                    <p className="text-zinc-500 mb-6 max-w-xs mx-auto">This file type cannot be previewed directly in the browser.</p>
                    <Button asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">Download File</a>
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}