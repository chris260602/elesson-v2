"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, QrCode, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have this
import { useSession } from "next-auth/react";
import { fetchQrCode, QrRequestPayload } from "@/apiRoutes/worksheets";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: QrRequestPayload | null;
  canDownload?: boolean; // New prop
}

export function QrCodeDialog({ open, onOpenChange, request, canDownload = false }: QrCodeDialogProps) {
  const { data: session } = useSession();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["qrCode", request], 
    queryFn: () => fetchQrCode(request!),
    enabled: open && !!request, 
    staleTime: 1000 * 60 * 5, 
  });

  const getAuthenticatedImageUrl = (url: string) => {
    if (!url) return "";
    
    // Cast to 'any' to access custom access_token property
    const token = (session as any)?.user?.access_token;
    
    if (!token) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  };

  const handleDownload = () => {
    if (!data?.qr_code) return;

    const baseAuthUrl = getAuthenticatedImageUrl(data.qr_code);
    
    // Append &download=true to trigger force download on backend/browser
    const separator = baseAuthUrl.includes('?') ? '&' : '?';
    const downloadUrl = `${baseAuthUrl}${separator}download=true`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = data.qr_code_name || "qrcode.png";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm flex flex-col items-center justify-center p-8">
        <DialogHeader>
          <DialogTitle className="text-center pb-2">Scan QR Code</DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-white border-2 rounded-xl shadow-sm min-h-[250px] min-w-[200px] flex flex-col items-center justify-center relative gap-4">
          
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-white/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Generating QR...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center text-red-500">
               <AlertCircle className="h-10 w-10 mb-2" />
               <span className="text-xs text-center">Failed to load QR Code</span>
            </div>
          ) : (data?.qr_code) ? (
            <>
              <img 
                src={getAuthenticatedImageUrl(data.qr_code)} 
                alt="QR Code" 
                className="w-48 h-48 object-contain" 
              />
              <span className="text-xs font-mono text-muted-foreground break-all text-center px-2 max-w-[220px]">
                {data.qr_code_name}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <QrCode className="h-16 w-16 opacity-20 mb-2" />
              <span className="text-xs">No Data Found</span>
            </div>
          )}

        </div>

        {/* Download Button Section */}
        {canDownload && data?.qr_code && !isLoading && !isError && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 gap-2 w-full"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download QR
          </Button>
        )}


          <p className="text-sm text-center text-muted-foreground mt-4">
            Use the mobile app to scan this code <br /> and access the resource.
          </p>
      </DialogContent>
    </Dialog>
  );
}